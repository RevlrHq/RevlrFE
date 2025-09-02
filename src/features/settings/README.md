# User Settings Management Feature

A comprehensive, accessible, and performant settings management system for the Revlr platform.

## Overview

The User Settings Management feature provides organizers with complete control over their account, preferences, and integrations. Built with modern React patterns, TypeScript, and accessibility best practices.

## Features

### ✅ Implemented Features

- **Profile Management**: Personal information, avatar upload, contact details
- **Security Settings**: Email changes, session management, password updates
- **Notification Preferences**: Email, push, and in-app notification controls
- **Interface Customization**: Themes, layouts, language preferences
- **Media Provider Integration**: Connect Unsplash, Pexels, Pixabay
- **Data Export**: Download account data in standard formats
- **Billing Management**: Payment methods, transaction history
- **Account Management**: Account deletion, data retention policies

### 🎯 Key Capabilities

- **Accessibility First**: WCAG 2.1 AA compliant with comprehensive audit tools
- **Mobile Responsive**: Optimized for all screen sizes and touch interactions
- **Performance Optimized**: Lazy loading, code splitting, intelligent caching
- **Real-time Updates**: Live validation and auto-save functionality
- **Analytics Tracking**: Comprehensive usage analytics and performance monitoring
- **Offline Support**: View settings and queue changes when offline
- **Security Focused**: Input sanitization, CSRF protection, audit logging

## Architecture

### Directory Structure

```
src/features/settings/
├── components/                 # Main layout components
├── profile/                   # Profile management
├── security/                  # Security settings
├── notifications/             # Notification preferences
├── interface/                 # UI customization
├── media-providers/           # External service integration
├── data-export/              # Data export functionality
├── billing/                  # Payment and billing
├── account/                  # Account management
├── shared/                   # Shared utilities and components
├── stores/                   # State management
├── services/                 # API services
├── types/                    # TypeScript definitions
├── docs/                     # Documentation
└── __tests__/               # Test suites
```

### Component Architecture

Each settings section follows a consistent pattern:

```
section/
├── SectionSettings.tsx       # Main container component
├── components/               # Section-specific components
├── hooks/                    # Custom hooks for the section
├── types.ts                  # TypeScript definitions
└── index.ts                  # Barrel exports
```

### State Management

- **Zustand stores** for each major section
- **React Query** for server state management
- **Local storage** for user preferences
- **Session storage** for temporary state

## Usage

### Basic Integration

```tsx
import { SettingsPage } from '@features/settings';
import { useAuthStore } from '@stores/authStore';

function SettingsRoute() {
    const { user } = useAuthStore();

    return <SettingsPage user={user} />;
}
```

### Individual Components

```tsx
import { ProfileSettings } from '@features/settings/profile';
import { SecuritySettings } from '@features/settings/security';

function CustomSettingsPage() {
    return (
        <div>
            <ProfileSettings />
            <SecuritySettings />
        </div>
    );
}
```

### Analytics Integration

```tsx
import { useSettingsAnalytics } from '@features/settings/shared/utils/analytics';

function MySettingsComponent() {
    const analytics = useSettingsAnalytics();

    const handleSettingChange = (setting: string, value: any) => {
        analytics.trackSettingChange('profile', setting, oldValue, value);
        // Update setting...
    };

    return (
        // Component JSX
    );
}
```

### Accessibility Monitoring

```tsx
import { useAccessibilityMonitor } from '@features/settings/shared/utils/accessibility-audit';

function SettingsWithA11yMonitoring() {
    const auditResult = useAccessibilityMonitor(
        process.env.NODE_ENV === 'development'
    );

    return (
        <div>
            {/* Settings content */}
            {auditResult && auditResult.issues.length > 0 && (
                <div>
                    Found {auditResult.issues.length} accessibility issues
                </div>
            )}
        </div>
    );
}
```

## API Integration

### Service Pattern

Each section has a dedicated service class:

```typescript
class ProfileService {
    async getProfile(): Promise<ExtendedUserProfile> {
        // Implementation
    }

    async updateProfile(updates: ProfileFormData): Promise<UserView> {
        // Implementation
    }
}
```

### Hook Pattern

Custom hooks encapsulate service calls and state management:

```typescript
export function useProfileUpdate() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateProfile = async (data: ProfileFormData) => {
        setIsLoading(true);
        try {
            await ProfileService.updateProfile(data);
            // Handle success
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { updateProfile, isLoading, error };
}
```

## Testing

### Test Structure

```
__tests__/
├── accessibility/            # Accessibility tests
├── integration/             # Integration tests
├── e2e/                     # End-to-end tests
├── mocks/                   # Test mocks and fixtures
└── utils/                   # Test utilities
```

### Running Tests

```bash
# Run all settings tests
pnpm test src/features/settings

# Run specific test suites
pnpm test src/features/settings/__tests__/integration
pnpm test src/features/settings/__tests__/accessibility

# Run with coverage
pnpm test:coverage src/features/settings
```

### Test Examples

```typescript
// Component test
describe('ProfileSettings', () => {
    it('should update profile information', async () => {
        render(<ProfileSettings user={mockUser} />);

        const nameInput = screen.getByLabelText('First Name');
        fireEvent.change(nameInput, { target: { value: 'John' } });

        const saveButton = screen.getByRole('button', { name: /save/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
        });
    });
});

// Accessibility test
describe('Settings Accessibility', () => {
    it('should have no accessibility violations', async () => {
        const { container } = render(<SettingsPage user={mockUser} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
```

## Performance

### Optimization Strategies

1. **Code Splitting**: Each section is lazy-loaded
2. **Bundle Analysis**: Automatic bundle size tracking
3. **Caching**: Intelligent caching of user preferences
4. **Debouncing**: Auto-save with debounced updates
5. **Virtual Scrolling**: For large lists (sessions, history)

### Performance Monitoring

```typescript
import { performanceTracking } from '@features/settings/shared/utils/analytics';

// Measure component render time
const endMeasure = performanceTracking.measureRender(
    'ProfileSettings',
    'profile'
);
// Component renders...
endMeasure();

// Measure API calls
const result = await performanceTracking.measureApiCall(
    () => ProfileService.updateProfile(data),
    'profile',
    'updateProfile'
);
```

## Security

### Security Measures

- **Input Sanitization**: All user inputs are sanitized
- **CSRF Protection**: State-changing operations are protected
- **Rate Limiting**: Sensitive operations have rate limits
- **Audit Logging**: Security-sensitive changes are logged
- **Data Encryption**: Sensitive data is encrypted

### Security Best Practices

```typescript
// Input sanitization
import { sanitizeInput } from '@features/settings/shared/utils/security';

const sanitizedData = sanitizeInput(userInput, {
    allowedTags: [],
    allowedAttributes: {},
});

// Secure API calls
import { secureApiCall } from '@features/settings/shared/utils/security';

const result = await secureApiCall('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
    csrfToken: getCsrfToken(),
});
```

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: Meets contrast requirements
- **Focus Management**: Logical focus order
- **Error Handling**: Accessible error messages

### Accessibility Features

```tsx
// Help tooltips
import { HelpTooltip } from '@features/settings/shared/components';

<HelpTooltip
    content="This setting controls how often you receive email notifications"
    title="Email Frequency"
    position="right"
/>

// Accessible forms
<label htmlFor="email">
    Email Address
    <HelpTooltip content="We'll send a verification email to confirm changes" />
</label>
<input
    id="email"
    type="email"
    aria-describedby="email-help"
    required
/>
<div id="email-help" className="sr-only">
    Enter your email address for account notifications
</div>
```

## Internationalization

### i18n Support

The settings feature is designed for internationalization:

```typescript
// Translation keys
const translations = {
    'settings.profile.title': 'Profile Settings',
    'settings.profile.description': 'Manage your personal information',
    // ... more translations
};

// Usage in components
import { useTranslation } from 'react-i18next';

function ProfileSettings() {
    const { t } = useTranslation('settings');

    return (
        <h1>{t('profile.title')}</h1>
    );
}
```

## Deployment

### Environment Configuration

```env
# Feature flags
NEXT_PUBLIC_FEATURE_SETTINGS_ONBOARDING=true
NEXT_PUBLIC_FEATURE_SETTINGS_ANALYTICS=true
NEXT_PUBLIC_FEATURE_ACCESSIBILITY_AUDIT=false

# API endpoints
NEXT_PUBLIC_SETTINGS_API_URL=/api/settings
NEXT_PUBLIC_ANALYTICS_API_URL=/api/analytics

# External services
UNSPLASH_ACCESS_KEY=your_key_here
PEXELS_API_KEY=your_key_here
```

### Build Optimization

```bash
# Analyze bundle size
pnpm build:analyze

# Check for unused code
pnpm build:tree-shake

# Performance audit
pnpm build:perf
```

## Contributing

### Development Setup

1. **Install dependencies**:

    ```bash
    pnpm install
    ```

2. **Start development server**:

    ```bash
    pnpm dev
    ```

3. **Run tests**:
    ```bash
    pnpm test:watch
    ```

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Custom rules for accessibility and performance
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks

### Adding New Settings

1. Create section directory under `src/features/settings/`
2. Implement main component following existing patterns
3. Add service class for API interactions
4. Create custom hooks for state management
5. Add comprehensive tests
6. Update navigation and routing
7. Add analytics tracking
8. Ensure accessibility compliance

### Pull Request Checklist

- [ ] All tests pass
- [ ] Accessibility audit passes
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Analytics tracking added
- [ ] Security review completed
- [ ] Mobile responsiveness verified

## Troubleshooting

### Common Issues

**Settings not saving**:

- Check network connectivity
- Verify API endpoints are accessible
- Check browser console for errors
- Ensure proper authentication

**Performance issues**:

- Enable performance monitoring
- Check bundle size analysis
- Verify lazy loading is working
- Monitor memory usage

**Accessibility issues**:

- Run accessibility audit
- Test with screen readers
- Verify keyboard navigation
- Check color contrast

### Debug Mode

Enable debug mode for detailed logging:

```typescript
// In development
localStorage.setItem('settings-debug', 'true');

// This will enable:
// - Detailed console logging
// - Performance metrics
// - Accessibility warnings
// - Analytics events
```

## Roadmap

### Planned Features

- [ ] Advanced security features (2FA, biometric auth)
- [ ] Team management settings
- [ ] Advanced analytics dashboard
- [ ] Custom notification rules
- [ ] API key management
- [ ] Webhook configuration
- [ ] Advanced data export options
- [ ] Settings import/export
- [ ] Multi-language support
- [ ] Dark mode enhancements

### Performance Goals

- [ ] < 100ms initial load time
- [ ] < 50ms section switching
- [ ] < 2MB total bundle size
- [ ] 95+ Lighthouse score
- [ ] 100% accessibility compliance

---

For more information, see the [User Guide](./docs/user-guide.md) or contact the development team.
