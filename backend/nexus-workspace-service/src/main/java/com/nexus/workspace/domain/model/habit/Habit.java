package com.nexus.workspace.domain.model.habit;

import com.nexus.common.exception.BusinessException;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 习惯聚合根（富领域模型）
 */
@Getter
public class Habit {
    private HabitId id;
    private Long userId;
    private String name;
    private String icon;
    private TargetType target;
    private Integer customDays;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<HabitCheckin> checkins;

    public Habit() {
        this.checkins = new ArrayList<>();
    }

    // 创建新习惯
    public static Habit create(Long userId, String name, String icon, TargetType target, Integer customDays) {
        Habit habit = new Habit();
        habit.userId = userId;
        habit.name = name;
        habit.icon = icon != null ? icon : "star-o";
        habit.target = target != null ? target : TargetType.DAILY;
        habit.customDays = customDays;
        habit.createdAt = LocalDateTime.now();
        return habit;
    }

    // 更新习惯信息
    public void update(String name, String icon, TargetType target, Integer customDays) {
        this.name = name;
        this.icon = icon;
        this.target = target;
        this.customDays = customDays;
        this.updatedAt = LocalDateTime.now();
    }

    // 打卡（核心业务行为）
    public HabitCheckin checkin(LocalDate date) {
        if (hasCheckedIn(date)) {
            throw new BusinessException(400, "当日已打卡");
        }
        if (!target.shouldCheckin(date, customDays)) {
            throw new BusinessException(400, "今日无需打卡");
        }
        HabitCheckin checkin = new HabitCheckin(this.id, this.userId, date);
        this.checkins.add(checkin);
        return checkin;
    }

    // 判断是否已打卡
    public boolean hasCheckedIn(LocalDate date) {
        return checkins.stream()
            .anyMatch(c -> c.getCheckinDate().equals(date));
    }

    // 是否属于指定用户
    public boolean belongsTo(Long userId) {
        return this.userId.equals(userId);
    }

    // 计算连续打卡天数
    public int calculateStreak() {
        if (checkins.isEmpty()) return 0;

        List<LocalDate> sortedDates = checkins.stream()
            .map(HabitCheckin::getCheckinDate)
            .sorted(LocalDate::compareTo)
            .toList();

        int streak = 0;
        LocalDate prevDate = null;
        for (int i = sortedDates.size() - 1; i >= 0; i--) {
            LocalDate date = sortedDates.get(i);
            if (prevDate == null) {
                streak = 1;
            } else if (prevDate.minusDays(1).equals(date)) {
                streak++;
            } else {
                break;
            }
            prevDate = date;
        }
        return streak;
    }

    // 今日是否需要打卡
    public boolean shouldCheckinToday() {
        return target.shouldCheckin(LocalDate.now(), customDays);
    }

    // 基础设施层使用的 setter
    public void setId(HabitId id) {
        this.id = id;
    }

    public void setIdValue(Long value) {
        this.id = value != null ? new HabitId(value) : null;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public void setTarget(TargetType target) {
        this.target = target;
    }

    public void setTargetFromString(String value) {
        this.target = TargetType.fromString(value);
    }

    public void setCustomDays(Integer customDays) {
        this.customDays = customDays;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setCheckins(List<HabitCheckin> checkins) {
        this.checkins = checkins != null ? checkins : new ArrayList<>();
    }

    // 用于基础设施层
    public Long getIdValue() {
        return id != null ? id.value() : null;
    }

    public String getTargetString() {
        return target != null ? target.toDbValue() : "daily";
    }
}