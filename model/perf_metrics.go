package model

import (
	"sort"
	"strings"

	"github.com/QuantumNous/new-api/common"
)

const (
	perfMetricsDefaultHours = 1
	perfMetricsMaxHours     = 24 * 30
	perfMetricsMaxFrtRows   = 8000
)

// PerfMetricModel 是模型广场卡片使用的单模型性能指标，延迟单位统一为毫秒。
type PerfMetricModel struct {
	ModelName     string  `json:"model_name"`
	AvgTps        float64 `json:"avg_tps"`
	AvgTtftMs     float64 `json:"avg_ttft_ms"`
	AvgLatencyMs  float64 `json:"avg_latency_ms"`
	SuccessRate   float64 `json:"success_rate"`
	SuccessCount  int64   `json:"success_count"`
	ErrorCount    int64   `json:"error_count"`
	TotalCount    int64   `json:"total_count"`
	LastSuccessAt int64   `json:"last_success_at"`
}

// PerfMetricGroup 是模型内某个分组的性能指标。
type PerfMetricGroup struct {
	Group string `json:"group"`
	PerfMetricModel
}

// PerfMetricsActivity 描述模型当前的运行状态。
type PerfMetricsActivity struct {
	Status        string `json:"status"`
	LastSuccessAt int64  `json:"last_success_at"`
	LastRequestAt int64  `json:"last_request_at"`
}

// PerfMetricsSummaryResult 是 /api/perf-metrics/summary 的返回体。
type PerfMetricsSummaryResult struct {
	WindowHours int               `json:"window_hours"`
	Models      []PerfMetricModel `json:"models"`
}

// PerfMetricsDetailResult 是 /api/perf-metrics 的返回体。
type PerfMetricsDetailResult struct {
	ModelName   string              `json:"model_name"`
	WindowHours int                 `json:"window_hours"`
	Groups      []PerfMetricGroup   `json:"groups"`
	Activity    PerfMetricsActivity `json:"activity"`
}

type perfMetricsAggRow struct {
	ModelName        string `gorm:"column:model_name"`
	GroupName        string `gorm:"column:group_name"`
	SuccessCount     int64  `gorm:"column:success_count"`
	ErrorCount       int64  `gorm:"column:error_count"`
	TotalUseTime     int64  `gorm:"column:total_use_time"`
	CompletionTokens int64  `gorm:"column:completion_tokens"`
	LastSuccessAt    int64  `gorm:"column:last_success_at"`
	LastRequestAt    int64  `gorm:"column:last_request_at"`
}

type perfMetricsFrtRow struct {
	ModelName string `gorm:"column:model_name"`
	GroupName string `gorm:"column:group_name"`
	Other     string `gorm:"column:other"`
}

func normalizePerfWindowHours(hours int) int {
	if hours <= 0 || hours > perfMetricsMaxHours {
		return perfMetricsDefaultHours
	}
	return hours
}

func buildPerfMetricModel(successCount, errorCount, totalUseTime, completionTokens, lastSuccessAt int64, frtSumMs float64, frtSamples int64) PerfMetricModel {
	metric := PerfMetricModel{
		SuccessCount:  successCount,
		ErrorCount:    errorCount,
		TotalCount:    successCount + errorCount,
		LastSuccessAt: lastSuccessAt,
	}
	if metric.TotalCount > 0 {
		metric.SuccessRate = float64(successCount) / float64(metric.TotalCount) * 100
	}
	if successCount > 0 && totalUseTime > 0 {
		metric.AvgLatencyMs = float64(totalUseTime) / float64(successCount) * 1000
		metric.AvgTps = float64(completionTokens) / float64(totalUseTime)
	}
	if frtSamples > 0 {
		metric.AvgTtftMs = frtSumMs / float64(frtSamples)
	}
	return metric
}

func perfActivityStatus(lastSuccessAt int64, windowSeconds int64) string {
	if lastSuccessAt <= 0 {
		return "unused"
	}
	if common.GetTimestamp()-lastSuccessAt <= windowSeconds {
		return "active"
	}
	return "unused"
}

func collectPerfFrtByModel(since int64) (map[string]float64, map[string]int64) {
	sumByModel := make(map[string]float64)
	countByModel := make(map[string]int64)
	rows := make([]perfMetricsFrtRow, 0)
	if err := LOG_DB.Table("logs").
		Select("model_name, other").
		Where("created_at >= ?", since).
		Where("type = ?", LogTypeConsume).
		Where("other LIKE ?", "%\"frt\"%").
		Order("id DESC").
		Limit(perfMetricsMaxFrtRows).
		Scan(&rows).Error; err != nil {
		return sumByModel, countByModel
	}
	for _, row := range rows {
		millis := firstTokenMillisFromLogOther(row.Other)
		if millis <= 0 {
			continue
		}
		sumByModel[row.ModelName] += millis
		countByModel[row.ModelName]++
	}
	return sumByModel, countByModel
}

// GetPerfMetricsSummary 按模型聚合性能指标，供模型广场卡片展示。
func GetPerfMetricsSummary(windowHours int) (*PerfMetricsSummaryResult, error) {
	windowHours = normalizePerfWindowHours(windowHours)
	since := common.GetTimestamp() - int64(windowHours)*3600
	result := &PerfMetricsSummaryResult{
		WindowHours: windowHours,
		Models:      []PerfMetricModel{},
	}

	rows := make([]perfMetricsAggRow, 0)
	if err := LOG_DB.Table("logs").
		Select("model_name, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS success_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS error_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN use_time ELSE 0 END), 0) AS total_use_time, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN completion_tokens ELSE 0 END), 0) AS completion_tokens, "+
			"COALESCE(MAX(CASE WHEN type = ? THEN created_at ELSE 0 END), 0) AS last_success_at, "+
			"COALESCE(MAX(created_at), 0) AS last_request_at",
			LogTypeConsume, LogTypeError, LogTypeConsume, LogTypeConsume, LogTypeConsume).
		Where("created_at >= ?", since).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Group("model_name").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	frtSum, frtCount := collectPerfFrtByModel(since)

	for _, row := range rows {
		name := strings.TrimSpace(row.ModelName)
		if name == "" {
			continue
		}
		metric := buildPerfMetricModel(
			row.SuccessCount, row.ErrorCount, row.TotalUseTime, row.CompletionTokens,
			row.LastSuccessAt, frtSum[name], frtCount[name],
		)
		metric.ModelName = name
		result.Models = append(result.Models, metric)
	}

	sort.SliceStable(result.Models, func(i, j int) bool {
		if result.Models[i].TotalCount != result.Models[j].TotalCount {
			return result.Models[i].TotalCount > result.Models[j].TotalCount
		}
		return result.Models[i].ModelName < result.Models[j].ModelName
	})

	return result, nil
}

// GetPerfMetricsDetail 返回单个模型的分组性能与活跃状态。
func GetPerfMetricsDetail(modelName string, windowHours int) (*PerfMetricsDetailResult, error) {
	modelName = strings.TrimSpace(modelName)
	windowHours = normalizePerfWindowHours(windowHours)
	result := &PerfMetricsDetailResult{
		ModelName:   modelName,
		WindowHours: windowHours,
		Groups:      []PerfMetricGroup{},
		Activity:    PerfMetricsActivity{Status: "unused"},
	}
	if modelName == "" {
		return result, nil
	}
	since := common.GetTimestamp() - int64(windowHours)*3600

	rows := make([]perfMetricsAggRow, 0)
	if err := LOG_DB.Table("logs").
		Select(logGroupCol+" AS group_name, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS success_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS error_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN use_time ELSE 0 END), 0) AS total_use_time, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN completion_tokens ELSE 0 END), 0) AS completion_tokens, "+
			"COALESCE(MAX(CASE WHEN type = ? THEN created_at ELSE 0 END), 0) AS last_success_at, "+
			"COALESCE(MAX(created_at), 0) AS last_request_at",
			LogTypeConsume, LogTypeError, LogTypeConsume, LogTypeConsume, LogTypeConsume).
		Where("model_name = ?", modelName).
		Where("created_at >= ?", since).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Group(logGroupCol).
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	frtRows := make([]perfMetricsFrtRow, 0)
	if err := LOG_DB.Table("logs").
		Select(logGroupCol+" AS group_name, other").
		Where("model_name = ?", modelName).
		Where("created_at >= ?", since).
		Where("type = ?", LogTypeConsume).
		Where("other LIKE ?", "%\"frt\"%").
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

	var lastSuccessAt int64
	var lastRequestAt int64
	for _, row := range rows {
		metric := buildPerfMetricModel(
			row.SuccessCount, row.ErrorCount, row.TotalUseTime, row.CompletionTokens,
			row.LastSuccessAt, frtSumByGroup[row.GroupName], frtCountByGroup[row.GroupName],
		)
		result.Groups = append(result.Groups, PerfMetricGroup{Group: row.GroupName, PerfMetricModel: metric})
		if row.LastSuccessAt > lastSuccessAt {
			lastSuccessAt = row.LastSuccessAt
		}
		if row.LastRequestAt > lastRequestAt {
			lastRequestAt = row.LastRequestAt
		}
	}

	sort.SliceStable(result.Groups, func(i, j int) bool {
		if result.Groups[i].TotalCount != result.Groups[j].TotalCount {
			return result.Groups[i].TotalCount > result.Groups[j].TotalCount
		}
		return result.Groups[i].Group < result.Groups[j].Group
	})

	result.Activity = PerfMetricsActivity{
		Status:        perfActivityStatus(lastSuccessAt, int64(windowHours)*3600),
		LastSuccessAt: lastSuccessAt,
		LastRequestAt: lastRequestAt,
	}

	return result, nil
}
