# Event Registration with Paystack Integration

This document explains the event registration system that integrates with Paystack for payment processing.

## Overview

The event registration system allows users to register for events either as authenticated users or as guests. For paid events, it integrates with Paystack to handle secure payment processing.

## Components

### 1. `useEventRegistration` Hook

Located at: `src/hooks/useEventRegistration.ts`

This hook handles the complete registration flow:

- Calls the registration API
- Handles both free and paid events
- Integrates with Paystack for payment processing
- Shows appropriate success/error messages

### 2. `TicketRegistrationFlow` Component

Located at: `src/features/event-details/components/TicketRegistrationFlow.tsx`

This component provides the UI for:

- Authentication options (Sign In, Sign Up, Continue as Guest)
- Guest information collection
- Order summary display

### 3. `RegistrationSuccess` Component

Located at: `src/components/RegistrationSuccess.tsx`

Shows a success modal after successful registration with:

- Registration confirmation
- Payment reference (if applicable)
- Next steps information

## Flow

### For Authenticated Users

1. User clicks register button
2. Registration API is called directly
3. If paid event: Paystack popup opens
4. Payment is processed and verified
5. Success message is shown

### For Guest Users

1. User clicks register button
2. Registration flow modal opens
3. User chooses "Continue as Guest"
4. User fills in their information
5. Registration API is called
6. If paid event: Paystack popup opens
7. Payment is processed and verified
8. Success message is shown

### For Unauthenticated Users (Sign In/Up)

1. User clicks register button
2. Registration flow modal opens
3. User chooses "Sign In" or "Create Account"
4. User is redirected to auth page
5. After successful auth, `usePostLoginAction` hook triggers
6. Registration is automatically processed
7. Success message is shown

## Configuration

### Environment Variables

Add to your `.env` file:

```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
```

### API Integration

The system uses the following API endpoints:

- `POST /api/Events/register` - Register for event
- `PUT /api/Events/registrations/{registrationId}/payment` - Update payment reference

## Paystack Integration

The system uses Paystack Popup v2 for payment processing:

1. **Script Loading**: Dynamically loads Paystack script if not already present
2. **Transaction Initialization**: Creates transaction with event and user details
3. **Payment Processing**: Handles success, cancel, and error scenarios
4. **Verification**: Updates registration with payment reference after successful payment

## Error Handling

The system handles various error scenarios:

- Network errors during registration
- Payment failures
- Payment cancellation
- Script loading failures

All errors are displayed to users via toast notifications.

## Usage Example

```tsx
import { useEventRegistration } from '../hooks/useEventRegistration';

const MyComponent = () => {
    const { registerForEvent, isLoading } = useEventRegistration();

    const handleRegister = async () => {
        const result = await registerForEvent({
            eventId: 'event-123',
            selectedTickets: [
                {
                    ticketId: 'ticket-456',
                    quantity: 1,
                    ticketName: 'General Admission',
                    ticketPrice: 5000, // in kobo
                },
            ],
            guestInfo: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '+2348012345678',
            },
        });

        if (result?.success) {
            console.log('Registration successful!');
        }
    };

    return (
        <button onClick={handleRegister} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Register'}
        </button>
    );
};
```

## Testing

To test the integration:

1. Set up a Paystack test account
2. Add your test public key to the environment variables
3. Create test events with both free and paid tickets
4. Test all registration flows (authenticated, guest, sign up/in)
5. Verify payment processing and webhook handling

## Security Notes

- Never expose your Paystack secret key in the frontend
- All payment verification should be done on the backend
- Use webhooks for reliable payment confirmation
- Validate all payment amounts on the backend before processing
