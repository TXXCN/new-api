package controller

import (
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// GetPerfMetricsSummary returns the per-model performance summary used by the
// pricing page cards (模型状态). It backs GET /api/perf-metrics/summary.
func GetPerfMetricsSummary(c *gin.Context) {
	windowHours := 1
	if raw := strings.TrimSpace(c.Query("hours")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			windowHours = parsed
		}
	}
	result, err := model.GetPerfMetricsSummary(windowHours)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

// GetPerfMetricsDetail returns the grouped performance and activity state for a
// single model. It backs GET /api/perf-metrics.
func GetPerfMetricsDetail(c *gin.Context) {
	modelName := strings.TrimSpace(c.Query("model"))
	if modelName == "" {
		common.ApiErrorMsg(c, "model is required")
		return
	}
	windowHours := 24
	if raw := strings.TrimSpace(c.Query("hours")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			windowHours = parsed
		}
	}
	result, err := model.GetPerfMetricsDetail(modelName, windowHours)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}
