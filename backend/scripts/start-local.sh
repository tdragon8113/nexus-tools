#!/bin/bash

# Nexus Tools 本地开发启动脚本
# 使用方式: ./start-local.sh [gateway|user|workspace|all]

set -e

ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
    set -a
    source "$ENV_FILE"
    set +a
fi

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

    if ! ls $jar_path 1>/dev/null 2>&1; then
        echo "JAR not found for $name, building..."
        case $name in
            gateway) mvn clean package -DskipTests -pl nexus-gateway -am ;;
            user) mvn clean package -DskipTests -pl nexus-user-service -am ;;
            workspace) mvn clean package -DskipTests -pl nexus-workspace-service -am ;;
        esac
    fi

    echo "Starting $service_name..."
    java -jar $jar_path &
}

case $1 in
    gateway|user|workspace)
        start_service "$1"
        ;;
    all)
        start_service gateway
        start_service user
        start_service workspace
        ;;
    *)
        echo "Usage: $0 [gateway|user|workspace|all]"
        exit 1
        ;;
esac

echo "Services started. Check logs for status."
