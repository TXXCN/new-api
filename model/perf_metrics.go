package model

import (
	"sort"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
)

const (
	perfMetricsDefaultHours  = 1
	perfMetricsMaxHours      = 24 * 30
	perfMetricsMaxFrtRows    = 8000
	perfMetricsSeriesBucket  = 3600
	perfMetricsSeriesMaxRows = 4000
	perfMetricsFailScanRows  = 200
	perfMetricsActiveWindow  = 3600
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

	// 以下字段对齐参考站 summary/detail 的扁平结构
	LastSuccessTs       int64  `json:"last_success_ts"`
	LastRequestTs       int64  `json:"last_request_ts"`
	ConsecutiveFailures int64  `json:"consecutive_failures"`
	LastErrorType       string `json:"last_error_type"`
	HealthStatus        string `json:"health_status"`
	SuccessCount24h     int64  `json:"success_count_24h"`
	FailureCount24h     int64  `json:"failure_count_24h"`
}

// PerfMetricSeriesPoint 是分组时间序列上的一个采样点。
type PerfMetricSeriesPoint struct {
	Ts           int64   `json:"ts"`
	AvgTps       float64 `json:"avg_tps"`
	AvgTtftMs    float64 `json:"avg_ttft_ms"`
	AvgLatencyMs float64 `json:"avg_latency_ms"`
	SuccessRate  float64 `json:"success_rate"`
	SuccessCount int64   `json:"success_count"`
	ErrorCount   int64   `json:"error_count"`
	TotalCount   int64   `json:"total_count"`
}

// PerfMetricGroup 是模型内某个分组的性能指标（含时间序列）。
type PerfMetricGroup struct {
	Group string `json:"group"`
	PerfMetricModel
	Series []PerfMetricSeriesPoint `json:"series"`
}

// PerfMetricsWindow 是一个时间窗口内的请求统计。
type PerfMetricsWindow struct {
	SuccessRate  float64 `json:"success_rate"`
	SuccessCount int64   `json:"success_count"`
	ErrorCount   int64   `json:"error_count"`
	TotalCount   int64   `json:"total_count"`
}

// PerfMetricsActivity 描述模型当前的运行状态。
type PerfMetricsActivity struct {
	OneHour             PerfMetricsWindow `json:"one_hour"`
	TwentyFourHours     PerfMetricsWindow `json:"twenty_four_hours"`
	LastSuccessTs       int64             `json:"last_success_ts"`
	LastRequestTs       int64             `json:"last_request_ts"`
	HealthStatus        string            `json:"health_status"`
	ConsecutiveFailures int64             `json:"consecutive_failures"`
	LastErrorType       string            `json:"last_error_type"`
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

type perfMetricsSeriesRow struct {
	GroupName        string `gorm:"column:group_name"`
	Bucket           int64  `gorm:"column:bucket"`
	SuccessCount     int64  `gorm:"column:success_count"`
	ErrorCount       int64  `gorm:"column:error_count"`
	TotalUseTime     int64  `gorm:"column:total_use_time"`
	CompletionTokens int64  `gorm:"column:completion_tokens"`
}

type perfMetricsFrtRow struct {
	ModelName string `gorm:"column:model_name"`
	GroupName string `gorm:"column:group_name"`
	Bucket    int64  `gorm:"column:bucket"`
	Other     string `gorm:"column:other"`
}

type perfMetricsRecentRow struct {
	Type    int    `gorm:"column:type"`
	Content string `gorm:"column:content"`
}

func itoa64(value int64) string {
	return strconv.FormatInt(value, 10)
}

func normalizePerfWindowHours(hours int) int {
	if hours <= 0 || hours > perfMetricsMaxHours {
		return perfMetricsDefaultHours
	}
	return hours
}

// buildPerfMetricModel 组装指标。首 token 延迟优先取流式请求上报的 frt；
// 若没有任何 frt 样本（全部为非流式请求），则退化为平均延迟，
// 因为非流式请求的「首 token」在语义上等同于完整响应返回的时刻。
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
	} else if metric.AvgLatencyMs > 0 {
		metric.AvgTtftMs = metric.AvgLatencyMs
	}
	return metric
}

// perfHealthStatus 依据最近请求时间与连续失败数推断状态：active / idle / error / unused。
func perfHealthStatus(lastSuccessAt, lastRequestAt int64, consecutiveFailures int64, now int64) string {
	if lastRequestAt <= 0 {
		return "unused"
	}
	if consecutiveFailures >= 3 {
		return "error"
	}
	if lastSuccessAt > 0 && now-lastSuccessAt <= perfMetricsActiveWindow {
		return "active"
	}
	return "idle"
}

func summarizePerfError(content string) string {
	text := strings.TrimSpace(content)
	if text == "" {
		return ""
	}
	if idx := strings.IndexAny(text, "\r\n"); idx > 0 {
		text = text[:idx]
	}
	runes := []rune(text)
	if len(runes) > 60 {
		text = string(runes[:60])
	}
	return text
}

// collectPerfFrtByModel 汇总窗口内各模型上报的首 token 毫秒数。
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

// queryRecentStats 取模型最近若干条日志，得出连续失败数与最近错误类型。
func queryRecentStats(modelName string) (int64, string) {
	recent := make([]perfMetricsRecentRow, 0)
	_ = LOG_DB.Table("logs").
		Select("type, content").
		Where("model_name = ?", modelName).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Order("id DESC").
		Limit(perfMetricsFailScanRows).
		Scan(&recent).Error

	var consecutiveFailures int64
	var lastErrorType string
	for _, row := range recent {
		if row.Type == LogTypeError {
			consecutiveFailures++
			if lastErrorType == "" {
				lastErrorType = summarizePerfError(row.Content)
			}
			continue
		}
		break
	}
	return consecutiveFailures, lastErrorType
}

// GetPerfMetricsSummary 按模型聚合性能指标，供模型广场卡片展示。
func GetPerfMetricsSummary(windowHours int) (*PerfMetricsSummaryResult, error) {
	windowHours = normalizePerfWindowHours(windowHours)
	now := common.GetTimestamp()
	since := now - int64(windowHours)*3600
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

	// 24 小时窗口的计数（卡片与详情都会用到）
	count24Rows := make([]perfMetricsAggRow, 0)
	_ = LOG_DB.Table("logs").
		Select("model_name, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS success_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS error_count",
			LogTypeConsume, LogTypeError).
		Where("created_at >= ?", now-24*3600).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Group("model_name").
		Scan(&count24Rows).Error
	count24 := make(map[string]perfMetricsAggRow, len(count24Rows))
	for _, row := range count24Rows {
		count24[strings.TrimSpace(row.ModelName)] = row
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
		metric.LastSuccessTs = row.LastSuccessAt
		metric.LastRequestTs = row.LastRequestAt

		consecutiveFailures, lastErrorType := queryRecentStats(name)
		metric.ConsecutiveFailures = consecutiveFailures
		metric.LastErrorType = lastErrorType
		metric.HealthStatus = perfHealthStatus(row.LastSuccessAt, row.LastRequestAt, consecutiveFailures, now)

		if c, ok := count24[name]; ok {
			metric.SuccessCount24h = c.SuccessCount
			metric.FailureCount24h = c.ErrorCount
		}

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

func queryPerfWindow(modelName string, since int64) PerfMetricsWindow {
	rows := make([]perfMetricsAggRow, 0)
	if err := LOG_DB.Table("logs").
		Select("COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS success_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS error_count",
			LogTypeConsume, LogTypeError).
		Where("model_name = ?", modelName).
		Where("created_at >= ?", since).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Scan(&rows).Error; err != nil || len(rows) == 0 {
		return PerfMetricsWindow{}
	}
	row := rows[0]
	window := PerfMetricsWindow{
		SuccessCount: row.SuccessCount,
		ErrorCount:   row.ErrorCount,
		TotalCount:   row.SuccessCount + row.ErrorCount,
	}
	if window.TotalCount > 0 {
		window.SuccessRate = float64(row.SuccessCount) / float64(window.TotalCount) * 100
	}
	return window
}

// GetPerfMetricsDetail 返回单个模型的分组性能、时间序列与活跃状态。
func GetPerfMetricsDetail(modelName string, windowHours int) (*PerfMetricsDetailResult, error) {
	modelName = strings.TrimSpace(modelName)
	windowHours = normalizePerfWindowHours(windowHours)
	result := &PerfMetricsDetailResult{
		ModelName:   modelName,
		WindowHours: windowHours,
		Groups:      []PerfMetricGroup{},
	}
	if modelName == "" {
		return result, nil
	}
	now := common.GetTimestamp()
	since := now - int64(windowHours)*3600

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

	bucketExpr := "created_at - (created_at % " + itoa64(perfMetricsSeriesBucket) + ")"

	seriesRows := make([]perfMetricsSeriesRow, 0)
	_ = LOG_DB.Table("logs").
		Select(logGroupCol+" AS group_name, "+
			bucketExpr+" AS bucket, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS success_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS error_count, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN use_time ELSE 0 END), 0) AS total_use_time, "+
			"COALESCE(SUM(CASE WHEN type = ? THEN completion_tokens ELSE 0 END), 0) AS completion_tokens",
			LogTypeConsume, LogTypeError, LogTypeConsume, LogTypeConsume).
		Where("model_name = ?", modelName).
		Where("created_at >= ?", since).
		Where("type IN ?", []int{LogTypeConsume, LogTypeError}).
		Group(logGroupCol + ", " + bucketExpr).
		Order(bucketExpr + " ASC").
		Scan(&seriesRows).Error

	frtRows := make([]perfMetricsFrtRow, 0)
	_ = LOG_DB.Table("logs").
		Select(logGroupCol+" AS group_name, "+
			bucketExpr+" AS bucket, other").
		Where("model_name = ?", modelName).
		Where("created_at >= ?", since).
		Where("type = ?", LogTypeConsume).
		Where("other LIKE ?", "%\"frt\"%").
		Order("id DESC").
		Limit(perfMetricsSeriesMaxRows).
		Scan(&frtRows).Error

	frtSumByKey := make(map[string]float64)
	frtCountByKey := make(map[string]int64)
	frtSumByGroup := make(map[string]float64)
	frtCountByGroup := make(map[string]int64)
	for _, row := range frtRows {
		millis := firstTokenMillisFromLogOther(row.Other)
		if millis <= 0 {
			continue
		}
		key := row.GroupName + "|" + itoa64(row.Bucket)
		frtSumByKey[key] += millis
		frtCountByKey[key]++
		frtSumByGroup[row.GroupName] += millis
		frtCountByGroup[row.GroupName]++
	}

	seriesByGroup := make(map[string][]PerfMetricSeriesPoint)
	for _, row := range seriesRows {
		point := PerfMetricSeriesPoint{
			Ts:           row.Bucket,
			SuccessCount: row.SuccessCount,
			ErrorCount:   row.ErrorCount,
			TotalCount:   row.SuccessCount + row.ErrorCount,
		}
		if point.TotalCount > 0 {
			point.SuccessRate = float64(row.SuccessCount) / float64(point.TotalCount) * 100
		}
		if row.SuccessCount > 0 && row.TotalUseTime > 0 {
			point.AvgLatencyMs = float64(row.TotalUseTime) / float64(row.SuccessCount) * 1000
			point.AvgTps = float64(row.CompletionTokens) / float64(row.TotalUseTime)
		}
		key := row.GroupName + "|" + itoa64(row.Bucket)
		if frtCountByKey[key] > 0 {
			point.AvgTtftMs = frtSumByKey[key] / float64(frtCountByKey[key])
		} else if point.AvgLatencyMs > 0 {
			point.AvgTtftMs = point.AvgLatencyMs
		}
		seriesByGroup[row.GroupName] = append(seriesByGroup[row.GroupName], point)
	}

	var lastSuccessAt int64
	var lastRequestAt int64
	for _, row := range rows {
		metric := buildPerfMetricModel(
			row.SuccessCount, row.ErrorCount, row.TotalUseTime, row.CompletionTokens,
			row.LastSuccessAt, frtSumByGroup[row.GroupName], frtCountByGroup[row.GroupName],
		)
		group := PerfMetricGroup{
			Group:           row.GroupName,
			PerfMetricModel: metric,
			Series:          seriesByGroup[row.GroupName],
		}
		if group.Series == nil {
			group.Series = []PerfMetricSeriesPoint{}
		}
		result.Groups = append(result.Groups, group)
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

	consecutiveFailures, lastErrorType := queryRecentStats(modelName)

	result.Activity = PerfMetricsActivity{
		OneHour:             queryPerfWindow(modelName, now-3600),
		TwentyFourHours:     queryPerfWindow(modelName, now-24*3600),
		LastSuccessTs:       lastSuccessAt,
		LastRequestTs:       lastRequestAt,
		HealthStatus:        perfHealthStatus(lastSuccessAt, lastRequestAt, consecutiveFailures, now),
		ConsecutiveFailures: consecutiveFailures,
		LastErrorType:       lastErrorType,
	}

	return result, nil
}
