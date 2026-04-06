# Nexus Tools

A developer toolkit combining development utilities and personal productivity management, built with cloud-native architecture.

## Features

### Developer Tools
- **JSON Toolkit** - Format, minify, validate
- **Text Processing** - Excel/CSV to JSON conversion, Markdown editor
- **Encoding/Decoding** - Base64, Hash generator, JWT parser
- **URL Tools** - URL encoding/decoding, Regex tester

### Productivity
- **Todo Management** - Task tracking with priorities and due dates
- **Time Tracking** - Activity logging and statistics reports

### Cloud Sync
- Offline-first design
- Real-time conflict resolution
- Version history

### User Experience
- CMD+K quick launch
- Custom keyboard shortcuts
- System theme adaptation

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mac App | SwiftUI + GRDB.swift |
| API Gateway | Spring Cloud Gateway |
| User Service | Spring Boot 3.x |
| Workspace Service | Spring Boot 3.x |
| Database | MySQL |
| Cache | Redis |
| Service Registry | Nacos |
| Message Queue | RabbitMQ |

## Project Structure

```
nexus-tools/
├── mac-app/              # SwiftUI Mac application
├── backend/
│   ├── nexus-gateway/    # API Gateway
│   ├── nexus-user-service/
│   ├── nexus-workspace-service/
│   └── nexus-common/
├── docs/
│   └── sql/              # Database scripts
└── docker/               # Docker configurations
```

## Getting Started

### Prerequisites
- Java 21
- Xcode 15+ (for Mac app)
- MySQL 8.0+
- Redis
- Nacos 2.x

### Backend Setup

```bash
cd backend

# Build
mvn clean package -DskipTests

# Start services
java -jar nexus-gateway/target/nexus-gateway-*.jar --spring.profiles.active=local &
java -jar nexus-user-service/target/nexus-user-service-*.jar --spring.profiles.active=local &
java -jar nexus-workspace-service/target/nexus-workspace-service-*.jar --spring.profiles.active=local &
```

### Mac App Setup

```bash
cd mac-app
open NexusTools.xcodeproj
# Build & Run in Xcode
```

## API Endpoints

| Service | Port | Path |
|---------|------|------|
| Gateway | 8080 | `/api/v1/*` |
| User Service | 8081 | Internal |
| Workspace Service | 8082 | Internal |

## Roadmap

- [x] Phase 1: Architecture foundation
- [ ] Phase 2: Local developer tools
- [ ] Phase 3: User authentication system
- [ ] Phase 4: Todo & time tracking
- [ ] Phase 5: Themes & keyboard shortcuts

## License

[MIT License](LICENSE)