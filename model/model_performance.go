package model

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
)

const (
	modelPerfDefaultWindowHours = 24
	modelPerfMaxWindowHours     = 24 * 30
	modelPerfMaxFrtSamples      = 2000
	modelPerfBucketSeconds      = 3600
)

// ModelPerformanceMetric holds aggregated performance figures for a model or
// for one group inside that model.
type ModelPerformanceMetric struct {
	Tps                  float64 `json:"tps"`
	AvgFirstTokenSeconds float64 `json:"avg_first_token_seconds"`
	AvgLatencySeconds    float64 `json:"avg_latency_seconds"`
	SuccessRate          float64 `json:"success_rate"`
	SuccessCount         int64   `json:"success_count"`
	ErrorCount           int64   `json:"error_count"`
	TotalCount           int64   `json:"total_count"`
	HasFirstTokenData    bool    `json:"has_first_token_data"`
	HasLatencyData       bool    `json:"has_latency_data"`
}

type ModelPerformanceGroup struct {
	Group string `json:"group"`
	ModelPerformanceMetric
}

type ModelPerformanceTrendPoint struct {
	Timestamp         int64   `json:"timestamp"`
	SuccessCount      int64   `json:"success_count"`
	ErrorCount        int64   `json:"error_count"`
	TotalCount        int64   `json:"total_count"`
	SuccessRate       float64 `json:"success_rate"`
	AvgLatencySeconds float64 `json:"avg_latency_seconds"`
	Tps               float64 `json:"tps"`
}

type ModelPerformanceResult struct {
	ModelName   string                       `json:"model_name"`
	WindowHours int                          `json:"window_hours"`
	Overall     ModelPerformanceMetric       `json:"overall"`
	Groups      []ModelPerformanceGroup      `json:"groups"`
	Trend       []ModelPerformanceTrendPoint `json:"trend"`
}

type modelPerfAggRow struct {
	GroupName        string `gorm:"column:group_name"`
	SuccessCount     int64  `gorm:"column:success_count"`
	ErrorCount       int64  `gorm:"column:error_count"`
	TotalUseTime     int64  `gorm:"column:total_use_time"`
	CompletionTokens int64  `gorm:"column:completion_tokens"`
}

type modelPerfFrtRow struct {
	GroupName string `gorm:"column:group_name"`
	Other     string `gorm:"column:other"`
}

type modelPerfTrendRow struct {
	Bucket           int64 `gorm:"column:bucket"`
	SuccessCount     int64 `gorm:"column:success_count"`
	ErrorCount       int64 `gorm:"column:error_count"`
	TotalUseTime     int64 `gorm:"column:total_use_time"`
	CompletionTokens int64 `gorm:"column:completion_tokens"`
}

func buildModelPerformanceMetric(successCount int64, errorCount int64, totalUseTime int64, completionTokens int64, frtSum float64, frtSamples int64) ModelPerformanceMetric {
	metric := ModelPerformanceMetric{
		SuccessCount: successCount,
		ErrorCount:   errorCount,
		TotalCount:   successCount + errorCount,
	}
	if metric.TotalCount > 0 {
		metric.SuccessRate = float64(successCount) / float64(metric.TotalCount) * 100
	}
	if successCount > 0 && totalUseTime > 0 {
		metric.AvgLatencySeconds = float64(totalUseTime) / float64(successCount)
		metric.HasLatencyData = true
		metric.Tps = float64(completionTokens) / float64(totalUseTime)
	}
	if frtSamples > 0 {
		metric.AvgFirstTokenSeconds = frtSum / float64(frtSamples) / 1000
		metric.HasFirstTokenData = true
	}
	return metric
}

// firstTokenMillisFromLogOther pulls the first-response time out of the log
// "other" JSON blob. It is stored in milliseconds and values <= 0 mean the
// upstream never reported a usable first token.
func firstTokenMillisFromLogOther(other string) float64 {
	if strings.TrimSpace(other) == "" {
		return 0
	}
	data, err := common.StrToMap(other)
	if err != nil || data == nil {
		return 0
	}
	value, ok := data["frt"]
	if !ok || value == nil {
		return 0
	}
	switch typed := value.(type) {
	case float64:
		return typed
	case float32:
		return float64(typed)
	case int:
		return float64(typed)
	case int64:
		return float64(typed)
	case string:
		parsed, err := strconv.ParseFloat(strings.TrimSpace(typed), 64)
		if err == nil {
			return parsed
		}
	}
	return 0
}

// GetModelPerformance aggregates model-level performance from the log table.
// Only COALESCE, CASE WHEN, SUM and the % operator are used so the query works
// on SQLite, MySQL and PostgreSQL alike.
func GetModelPerformance(modelName string, windowHours int) (*ModelPerformanceResult, error) {
	modelName = strings.TrimSpace(modelName)
	if windowHours <= 0 || windowHours > modelPerfMaxWindowHours {
		windowHours = modelPerfDefaultWindowHours
	}
	result := &ModelPerformanceResult{
		ModelName:   modelName,
		WindowHours: windowHours,
		Groups:      []ModelPerformanceGroup{},
		Trend:       []ModelPerformanceTrendPoint{},
	}
	if modelName == "" {
		return result, nil
	}
	since := common.GetTimestamp() - int64(windowHours)*3600

	aggRows := make([]modelPerfAggRow, 0)
	if err := LOG_DB.Table("logs").
		Select(logGroupCol+" AS group_name, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS success_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS error_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN use_time ELSE 0 END), 0) AS total_use_time, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN completion_tokens ELSE 0 END), 0) AS completion_tokens",
			LogTypeConsume, LogTypeError, LogTypeConsume, LogTypeConsume).
		Where("model_name = ?", modelName).
		Where("created_at >= ?", since).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Group(logGroupCol).
		Scan(&aggRows).Error; err != nil {
		return nil, err
	}

	frtRows := make([]modelPerfFrtRow, 0)
	if err := LOG_DB.Table("logs").
		Select(logGroupCol+" AS group_name, other").
		Where("model_name = ?", modelName).
		Where("created_at >= ?", since).
		Where("type = ?", LogTypeConsume).
		Where("other LIKE ?", `%"frt"%`).
		Order("id DESC").
		Limit(modelPerfMaxFrtSamples).
		Scan(&frtRows).Error; err != nil {
		return nil, err
	}

	frtSumByGroup := make(map[string]float64)
	frtCountByGroup := make(map[string]int64)
	for _, row := range frtRows {
		millis := firstTokenMillisFromLogOther(row.Other)
		if millis <= 0 {
			continue
		}
		frtSumByGroup[row.GroupName] += millis
		frtCountByGroup[row.GroupName]++
	}

	var overallSuccess, overallError, overallUseTime, overallCompletion int64
	var overallFrtSum float64
	var overallFrtCount int64
	for _, row := range aggRows {
		result.Groups = append(result.Groups, ModelPerformanceGroup{
			Group: row.GroupName,
			ModelPerformanceMetric: buildModelPerformanceMetric(
				row.SuccessCount, row.ErrorCount, row.TotalUseTime, row.CompletionTokens,
				frtSumByGroup[row.GroupName], frtCountByGroup[row.GroupName],
			),
		})
		overallSuccess += row.SuccessCount
		overallError += row.ErrorCount
		overallUseTime += row.TotalUseTime
		overallCompletion += row.CompletionTokens
		overallFrtSum += frtSumByGroup[row.GroupName]
		overallFrtCount += frtCountByGroup[row.GroupName]
	}

	sort.SliceStable(result.Groups, func(i, j int) bool {
		if result.Groups[i].TotalCount != result.Groups[j].TotalCount {
			return result.Groups[i].TotalCount > result.Groups[j].TotalCount
		}
		return result.Groups[i].Group < result.Groups[j].Group
	})

	result.Overall = buildModelPerformanceMetric(
		overallSuccess, overallError, overallUseTime, overallCompletion,
		overallFrtSum, overallFrtCount,
	)

	bucketExpr := fmt.Sprintf("created_at - (created_at %% %d)", modelPerfBucketSeconds)
	trendRows := make([]modelPerfTrendRow, 0)
	if err := LOG_DB.Table("logs").
		Select(bucketExpr+" AS bucket, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS success_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS error_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN use_time ELSE 0 END), 0) AS total_use_time, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN completion_tokens ELSE 0 END), 0) AS completion_tokens",
			LogTypeConsume, LogTypeError, LogTypeConsume, LogTypeConsume).
		Where("model_name = ?", modelName).
		Where("created_at >= ?", since).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Group(bucketExpr).
		Order(bucketExpr + " ASC").
		Scan(&trendRows).Error; err != nil {
		return nil, err
	}

	for _, row := range trendRows {
		point := ModelPerformanceTrendPoint{
			Timestamp:    row.Bucket,
			SuccessCount: row.SuccessCount,
			ErrorCount:   row.ErrorCount,
			TotalCount:   row.SuccessCount + row.ErrorCount,
		}
		if point.TotalCount > 0 {
			point.SuccessRate = float64(row.SuccessCount) / float64(point.TotalCount) * 100
		}
		if row.SuccessCount > 0 && row.TotalUseTime > 0 {
			point.AvgLatencySeconds = float64(row.TotalUseTime) / float64(row.SuccessCount)
			point.Tps = float64(row.CompletionTokens) / float64(row.TotalUseTime)
		}
		result.Trend = append(result.Trend, point)
	}

	return result, nil
}
