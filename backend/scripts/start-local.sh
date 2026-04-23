#!/bin/bash

# Nexus Tools 本地开发启动脚本（带 SkyWalking Agent）
# 使用方式: ./start-local.sh [service]
# service: gateway | user | workspace | all

set -e

# 加载环境变量
ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

# SkyWalking Agent 路径
SKYWALKING_AGENT="../skywalking-agent/skywalking-agent.jar"

# OAP 服务地址（本地使用 Docker 运行的 SkyWalking）
# 如果没有 OAP，设置为空字符串，agent 会仅输出日志但不生成真实 traceId
SW_OAP_ADDR="${SW_AGENT_COLLECTOR_BACKEND_SERVICES:-127.0.0.1:11800}"

# 启动单个服务
start_service() {
    local name=$1
    local jar_path=""
    local service_name=""

    case $name in
        gateway)
            jar_path="nexus-gateway/target/*.jar"
            service_name="nexus-gateway"
            ;;
        user)
            jar_path="nexus-user-service/target/*.jar"
            service_name="nexus-user-service"
            ;;
        workspace)
            jar_path="nexus-workspace-service/target/*.jar"
            service_name="nexus-workspace-service"
            ;;
        *)
            echo "Unknown service: $name"
            exit 1
            ;;
    esac

    if [ ! -f "$jar_path" ]; then
        echo "JAR not found for $name, building..."
        mvn clean package -DskipTests -pl nexus-$name-service -am
    fi

    echo "Starting $service_name with SkyWalking agent..."

    java -javaagent:"$SKYWALKING_AGENT" \
         -Dskywalking.agent.service_name="$service_name" \
         -Dskywalking.collector.backend_service="$SW_OAP_ADDR" \
         -Dskywalking.logging.output=CONSOLE \
         -jar "$jar_path" &
}

# 主逻辑
case $1 in
    gateway)
        start_service gateway
        ;;
    user)
        start_service user
        ;;
    workspace)
        start_service workspace
        ;;
    all)
        start_service gateway
        start_service user
        start_service workspace
        ;;
    *)
        echo "Usage: $0 [gateway|user|workspace|all]"
        echo ""
        echo "环境变量配置 (可在 ../.env 中设置):"
        echo "  SW_AGENT_COLLECTOR_BACKEND_SERVICES - SkyWalking OAP 地址 (默认: 127.0.0.1:11800)"
        echo ""
        echo "启动 SkyWalking OAP (Docker):"
        echo "  docker run -d --name skywalking-oap -p 11800:11800 -p 12800:12800 apache/skywalking-oap-server:9.6.0"
        echo "  docker run -d --name skywalking-ui -p 8080:8080 -e SW_OAP_ADDRESS=http://skywalking-oap:12800 --link skywalking-oap:skywalking-oap apache/skywalking-ui:9.6.0"
        exit 1
        ;;
esac

echo "Services started. Check logs for status."