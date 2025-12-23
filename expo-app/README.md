# Nyx Fit Mobile

React Native Expo application for workout tracking and fitness management.

## Project Structure

This project follows the established patterns from the web application:

```
app/                    # Expo Router file-based routing
├── (auth)/            # Authentication screens
├── (tabs)/            # Main tab navigation
│   ├── workouts/      # Workout management
│   ├── weight.tsx     # Weight tracking
│   ├── settings.tsx   # App settings
│   └── index.tsx      # Home screen
└── _layout.tsx        # Root layout

src/
├── components/        # Reusable components
│   ├── ui/           # Base UI components
│   └── app/          # App-specific components
├── lib/              # Utility functions
├── hooks/            # Custom React hooks
└── types/            # TypeScript type definitions
```

## Technology Stack

- **React Native** with Expo SDK 54+
- **Expo Router** for file-based navigation
- **NativeWind v4** for Tailwind CSS styling
- **Convex** for backend integration
- **Better Auth** for authentication
- **TypeScript** for type safety

## Development

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the development server:
   ```bash
   bun start
   ```

3. Run on specific platforms:
   ```bash
   bun run android  # Android
   bun run ios      # iOS (macOS required)
   bun run web      # Web
   ```

## Configuration

- Configure Convex URL in `.env.local`
- Update app metadata in `app.json`
- Customize theme colors in `global.css`

## Requirements Addressed

This setup addresses the following requirements:
- **1.1**: Same project structure patterns as web app
- **1.2**: Component organization (ui/, app/, features/)
- **1.4**: File naming conventions maintained

## Next Steps

1. Configure Convex integration
2. Set up authentication system
3. Implement UI component library
4. Add navigation system
5. Build core features (workouts, weight tracking, etc.)