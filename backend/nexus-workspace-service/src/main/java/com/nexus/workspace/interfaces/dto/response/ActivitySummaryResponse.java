package com.nexus.workspace.interfaces.dto.response;

import lombok.Data;

@Data
public class ActivitySummaryResponse {
    private int totalXp;
    private int level;
    private double levelProgress;
    private int recordDays;
    private int streak;
}
