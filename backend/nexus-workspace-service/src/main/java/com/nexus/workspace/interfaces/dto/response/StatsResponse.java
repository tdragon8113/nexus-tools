package com.nexus.workspace.interfaces.dto.response;

import lombok.Data;

import java.util.Map;

/**
 * 统计响应 DTO
 */
@Data
public class StatsResponse {
    private Integer todayMinutes;
    private Integer weekMinutes;
    private Integer monthMinutes;
    private Integer totalSessions;
    private Map<String, Integer> hourlyDistribution;
    private Map<String, Integer> dailyDistribution;
}