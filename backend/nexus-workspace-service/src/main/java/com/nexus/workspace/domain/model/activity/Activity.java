package com.nexus.workspace.domain.model.activity;

import com.nexus.workspace.domain.model.activity.ActivityCategory;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Activity 实体（富领域模型）
 */
@Getter
public class Activity {
    private Long id;
    private Long userId;
    private String title;
    private ActivityCategory category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String notes;
    private LocalDateTime createdAt;

    public Activity() {}

    // 创建番茄专注记录
    public static Activity createPomodoro(Long userId, String title, LocalDateTime startTime, LocalDateTime endTime, Integer durationMinutes, String notes) {
        Activity activity = new Activity();
        activity.userId = userId;
        activity.title = title;
        activity.category = ActivityCategory.POMODORO_WORK;
        activity.startTime = startTime;
        activity.endTime = endTime;
        activity.durationMinutes = durationMinutes;
        activity.notes = notes;
        activity.createdAt = LocalDateTime.now();
        return activity;
    }

    // 创建其他类型记录
    public static Activity create(Long userId, String title, ActivityCategory category, LocalDateTime startTime, LocalDateTime endTime, Integer durationMinutes, String notes) {
        Activity activity = new Activity();
        activity.userId = userId;
        activity.title = title;
        activity.category = category != null ? category : ActivityCategory.POMODORO_WORK;
        activity.startTime = startTime;
        activity.endTime = endTime;
        activity.durationMinutes = durationMinutes;
        activity.notes = notes;
        activity.createdAt = LocalDateTime.now();
        return activity;
    }

    // 是否属于指定用户
    public boolean belongsTo(Long userId) {
        return this.userId.equals(userId);
    }

    // 是否为番茄专注
    public boolean isPomodoroWork() {
        return category != null && category.isPomodoroWork();
    }

    // 计算时长（如果未提供）
    public int calculateDuration() {
        if (durationMinutes != null) return durationMinutes;
        if (startTime != null && endTime != null) {
            return (int) java.time.Duration.between(startTime, endTime).toMinutes();
        }
        return 0;
    }

    // 基础设施层使用的 setter
    public void setId(Long id) {
        this.id = id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setCategory(ActivityCategory category) {
        this.category = category;
    }

    public void setCategoryFromString(String value) {
        this.category = ActivityCategory.fromString(value);
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // 用于基础设施层
    public String getCategoryCode() {
        return category != null ? category.getCode() : "pomodoro-work";
    }
}