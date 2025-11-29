# LMS System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        A --> B[React Frontend]
    end

    subgraph "Application Layer"
        B --> C[API Gateway / Routes]
        C --> D[Laravel Controllers]
        D --> E[Business Logic]
        E --> F[Models]
    end

    subgraph "Data Layer"
        F --> G[MySQL Database]
        H[File Storage] --> I[Uploaded Files]
    end

    subgraph "Authentication"
        J[Sanctum Tokens]
        B --> J
        D --> J
    end

    subgraph "External Services"
        K[Email Service<br/>(Future)]
        L[Cloud Storage<br/>(Future)]
    end

    A -->|HTTP/HTTPS| C
    D -->|Queries| G
    D -->|Store Files| H
    J -->|Validate Tokens| D

    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef data fill:#e8f5e8
    classDef auth fill:#fff3e0
    classDef external fill:#fce4ec

    class A,B frontend
    class C,D,E,F backend
    class G,H,I data
    class J auth
    class K,L external
```

## Architecture Overview

### Frontend (React)
- **Components**: HierarchicalLectureContent, CourseManage, StudentDashboard, etc.
- **Routing**: React Router for navigation
- **State Management**: React hooks and context
- **UI Library**: Tailwind CSS for styling
- **HTTP Client**: Fetch API for API calls

### Backend (Laravel)
- **Framework**: Laravel 10+
- **Authentication**: Laravel Sanctum for token-based auth
- **API**: RESTful endpoints for CRUD operations
- **Controllers**: Handle requests for users, courses, assignments, submissions, etc.
- **Models**: Eloquent ORM for database interactions
- **Middleware**: Authorization and validation

### Database (MySQL)
- **Tables**: users, courses, assignments, submissions, course_lectures, announcements, etc.
- **Relationships**: Foreign keys for data integrity
- **Migrations**: Version-controlled schema changes

### File Storage
- **Local Storage**: Uploaded files stored in `storage/app/public`
- **Access**: Symlinked to `public/storage` for web access
- **Limits**: Configured upload size limits

### Security
- **Authentication**: JWT tokens via Sanctum
- **Authorization**: Role-based access (Admin, Teacher, Student)
- **Validation**: Request validation in controllers
- **CSRF Protection**: Enabled for web routes

### Deployment
- **Web Server**: Nginx/Apache
- **PHP**: PHP 8.1+
- **Database Server**: MySQL 8.0+
- **Build Tools**: Vite for frontend, Composer for PHP dependencies

### Future Extensions
- **Microservices**: Separate services for notifications, analytics
- **Caching**: Redis for performance
- **Queue System**: Laravel Queues for background jobs
- **CDN**: For static assets and file delivery