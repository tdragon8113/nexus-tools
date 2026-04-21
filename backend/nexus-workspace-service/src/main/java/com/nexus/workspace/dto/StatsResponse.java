package com.nexus.workspace.dto;

import lombok.Data;
import java.util.Map;

/**
 * 时间统计数据响应
 */
@Data
public class StatsResponse {
    private Integer todayMinutes;       // 今日专注分钟
    private Integer weekMinutes;        // 本周专注分钟
    private Integer monthMinutes;       // 本月专注分钟
    private Integer totalSessions;      // 总专注次数
    private Map<String, Integer> hourlyDistribution; // 每小时分布 (key: "08", value: minutes)
    private Map<String, Integer> dailyDistribution;  // 每日分布 (key: "2026-04-21", value: minutes)
}