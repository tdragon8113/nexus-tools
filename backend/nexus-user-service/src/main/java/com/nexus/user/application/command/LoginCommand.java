package com.nexus.user.application.command;

/**
 * 登录命令
 */
public record LoginCommand(
    String username,
    String password
) {}