# Diagrama de Clases — Proyecto Final

## Entidades del Backend (NestJS + TypeORM)

```mermaid
classDiagram
    direction TB

    class Role {
        +number id
        +string name
        +string description
        +Date createdAt
        +Date updatedAt
        +User[] users
    }

    class User {
        +number id
        +string email
        +string password
        +string firstName
        +string lastName
        +number roleId
        +boolean isActive
        +Date lastLogin
        +Date createdAt
        +Date updatedAt
        +Role role
        +SubadminArea[] assignedAreas
        +PointOfInterest[] pointsCreated
        +Event[] eventsCreated
        +News[] newsCreated
        +AuditLog[] auditLogs
    }

    class Area {
        +number id
        +string name
        +string code
        +string description
        +number parentAreaId
        +object coordinates
        +object metadata
        +boolean isActive
        +Date createdAt
        +Date updatedAt
        +Area parentArea
        +Area[] childAreas
        +PointOfInterest[] pointsOfInterest
    }

    class SubadminArea {
        +number id
        +number userId
        +number areaId
        +number assignedBy
        +Date createdAt
        +User user
        +Area area
        +User assignedByUser
    }

    class PointOfInterest {
        +number id
        +string title
        +string description
        +number areaId
        +string category
        +object coordinates
        +string iconUrl
        +string[] images
        +object additionalInfo
        +boolean isVisible
        +number orderIndex
        +number createdBy
        +Date createdAt
        +Date updatedAt
        +Area area
        +User createdByUser
    }

    class Event {
        +number id
        +string title
        +string description
        +number areaId
        +number pointOfInterestId
        +Date eventDate
        +string startTime
        +string endTime
        +string location
        +string imageUrl
        +string category
        +boolean isPublished
        +number createdBy
        +Date createdAt
        +Date updatedAt
        +Area area
        +PointOfInterest pointOfInterest
        +User createdByUser
    }

    class News {
        +number id
        +string title
        +string summary
        +string content
        +number areaId
        +string featuredImage
        +string category
        +boolean isPublished
        +boolean isFeatured
        +Date publishDate
        +number createdBy
        +Date createdAt
        +Date updatedAt
        +Area area
        +User createdByUser
    }

    class AuditLog {
        +number id
        +number userId
        +string action
        +string entityType
        +number entityId
        +object oldValues
        +object newValues
        +string ipAddress
        +string userAgent
        +Date createdAt
        +User user
    }

    class Statistic {
        +number id
        +string eventType
        +string entityType
        +number entityId
        +number userId
        +string sessionId
        +object metadata
        +string ipAddress
        +string userAgent
        +Date createdAt
    }

    %% Relaciones
    Role "1" --> "0..*" User : tiene
    User "1" --> "0..*" SubadminArea : asignado a
    Area "1" --> "0..*" SubadminArea : contiene
    User "1" --> "0..*" SubadminArea : asignó (assignedByUser)

    Area "1" --> "0..*" PointOfInterest : tiene
    User "1" --> "0..*" PointOfInterest : creó

    Area "0..1" --> "0..*" Event : sede
    PointOfInterest "0..1" --> "0..*" Event : lugar
    User "1" --> "0..*" Event : creó

    Area "0..1" --> "0..*" News : relacionada
    User "1" --> "0..*" News : creó

    User "1" --> "0..*" AuditLog : generó

    Area "1" --> "0..*" Area : padre de (childAreas)
```

## Descripción de Relaciones

| Entidad Origen | Relación | Entidad Destino | Tipo |
|---|---|---|---|
| `Role` | tiene → | `User` | OneToMany |
| `User` | tiene asignadas → | `SubadminArea` | OneToMany |
| `Area` | contiene → | `SubadminArea` | OneToMany |
| `Area` | tiene → | `PointOfInterest` | OneToMany |
| `User` | creó → | `PointOfInterest` | OneToMany |
| `Area` | sede de → | `Event` | OneToMany |
| `PointOfInterest` | lugar de → | `Event` | OneToMany |
| `User` | creó → | `Event` | OneToMany |
| `Area` | relacionada con → | `News` | OneToMany |
| `User` | creó → | `News` | OneToMany |
| `User` | generó → | `AuditLog` | OneToMany |
| `Area` | padre de → | `Area` | Self-referential ManyToOne |
