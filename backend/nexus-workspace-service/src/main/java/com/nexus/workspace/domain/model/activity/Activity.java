package com.nexus.workspace.domain.model.activity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Activity 实体（时光记活动记录）
 */
@Getter
@TableName("activities")
public class Activity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String title;
    private String category;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private Integer mood;
    private Integer xp;
    private String notes;
    private LocalDateTime createdAt;

    public Activity() {}

    public static Activity create(
        Long userId,
        String title,
        String category,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer durationMinutes,
        Integer mood,
        Integer xp,
        String notes
    ) {
        Activity activity = new Activity();
        activity.userId = userId;
        activity.title = title;
        activity.category = category != null && !category.isBlank() ? category : "other";
        activity.startTime = startTime;
        activity.endTime = endTime;
        activity.durationMinutes = durationMinutes;
        activity.mood = mood;
        activity.xp = xp != null ? xp : 0;
        activity.notes = notes;
        activity.createdAt = LocalDateTime.now();
        return activity;
    }

    public boolean belongsTo(Long userId) {
        return userId != null && userId.equals(this.userId);
    }

    public boolean isOngoing() {
        return endTime == null;
    }

    public int calculateDuration() {
        if (durationMinutes != null) {
            return durationMinutes;
        }
        if (startTime != null && endTime != null) {
            return (int) java.time.Duration.between(startTime, endTime).toMinutes();
        }
        return 0;
    }

    /** 统计口径：进行中活动按 referenceTime 计算已进行时长 */
    public int getStatsDurationMinutes(LocalDateTime referenceTime) {
        if (isOngoing()) {
            if (startTime != null && referenceTime != null) {
                return Math.max(0, (int) java.time.Duration.between(startTime, referenceTime).toMinutes());
            }
            return 0;
        }
        if (durationMinutes != null) {
            return durationMinutes;
        }
        return calculateDuration();
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public void setMood(Integer mood) {
        this.mood = mood;
    }

    public void setXp(Integer xp) {
        this.xp = xp;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
