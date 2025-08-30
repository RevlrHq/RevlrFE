/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationPriority } from './NotificationPriority';
import type { NotificationType } from './NotificationType';
export type BroadcastNotificationRequest = {
    type?: NotificationType;
    title?: string | null;
    message?: string | null;
    priority?: NotificationPriority;
    actionUrl?: string | null;
    data?: any;
};

