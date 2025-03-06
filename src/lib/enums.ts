export const ServiceMode = {
    QUERY: 'query',
    MUTATION: 'mutation',
} as const;

export type ServiceMode = (typeof ServiceMode)[keyof typeof ServiceMode];
