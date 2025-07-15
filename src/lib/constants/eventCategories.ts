// Event Category System - Based on the new enum-based implementation
export enum EventCategory {
    BusinessProfessional = 'BusinessProfessional',
    TechnologyInnovation = 'TechnologyInnovation',
    ArtsCulture = 'ArtsCulture',
    MusicEntertainment = 'MusicEntertainment',
    SportsFitness = 'SportsFitness',
    FoodDrink = 'FoodDrink',
    HealthWellness = 'HealthWellness',
    EducationLearning = 'EducationLearning',
    CommunitySocial = 'CommunitySocial',
    FashionBeauty = 'FashionBeauty',
    TravelAdventure = 'TravelAdventure',
    FamilyKids = 'FamilyKids',
    ReligionSpirituality = 'ReligionSpirituality',
    CharityCauses = 'CharityCauses',
    GovernmentPolitics = 'GovernmentPolitics',
    ScienceResearch = 'ScienceResearch',
    Automotive = 'Automotive',
    RealEstate = 'RealEstate',
    FinanceInvestment = 'FinanceInvestment',
    MarketingSales = 'MarketingSales',
    GamingEsports = 'GamingEsports',
    Photography = 'Photography',
    FilmMedia = 'FilmMedia',
    Other = 'Other',
}

export interface CategoryInfo {
    value: EventCategory;
    description: string;
    group: string;
}

export const CATEGORY_DESCRIPTIONS: Record<EventCategory, string> = {
    [EventCategory.BusinessProfessional]: 'Business & Professional',
    [EventCategory.TechnologyInnovation]: 'Technology & Innovation',
    [EventCategory.ArtsCulture]: 'Arts & Culture',
    [EventCategory.MusicEntertainment]: 'Music & Entertainment',
    [EventCategory.SportsFitness]: 'Sports & Fitness',
    [EventCategory.FoodDrink]: 'Food & Drink',
    [EventCategory.HealthWellness]: 'Health & Wellness',
    [EventCategory.EducationLearning]: 'Education & Learning',
    [EventCategory.CommunitySocial]: 'Community & Social',
    [EventCategory.FashionBeauty]: 'Fashion & Beauty',
    [EventCategory.TravelAdventure]: 'Travel & Adventure',
    [EventCategory.FamilyKids]: 'Family & Kids',
    [EventCategory.ReligionSpirituality]: 'Religion & Spirituality',
    [EventCategory.CharityCauses]: 'Charity & Causes',
    [EventCategory.GovernmentPolitics]: 'Government & Politics',
    [EventCategory.ScienceResearch]: 'Science & Research',
    [EventCategory.Automotive]: 'Automotive',
    [EventCategory.RealEstate]: 'Real Estate',
    [EventCategory.FinanceInvestment]: 'Finance & Investment',
    [EventCategory.MarketingSales]: 'Marketing & Sales',
    [EventCategory.GamingEsports]: 'Gaming & Esports',
    [EventCategory.Photography]: 'Photography',
    [EventCategory.FilmMedia]: 'Film & Media',
    [EventCategory.Other]: 'Other',
};

export const CATEGORY_GROUPS: Record<string, EventCategory[]> = {
    'Business & Professional': [
        EventCategory.BusinessProfessional,
        EventCategory.TechnologyInnovation,
        EventCategory.FinanceInvestment,
        EventCategory.MarketingSales,
        EventCategory.RealEstate,
    ],
    'Arts & Entertainment': [
        EventCategory.ArtsCulture,
        EventCategory.MusicEntertainment,
        EventCategory.FashionBeauty,
        EventCategory.Photography,
        EventCategory.FilmMedia,
    ],
    'Health & Lifestyle': [
        EventCategory.HealthWellness,
        EventCategory.SportsFitness,
        EventCategory.FoodDrink,
        EventCategory.TravelAdventure,
    ],
    'Education & Community': [
        EventCategory.EducationLearning,
        EventCategory.CommunitySocial,
        EventCategory.FamilyKids,
        EventCategory.CharityCauses,
    ],
    'Technology & Gaming': [
        EventCategory.TechnologyInnovation,
        EventCategory.GamingEsports,
        EventCategory.ScienceResearch,
    ],
    Other: [
        EventCategory.ReligionSpirituality,
        EventCategory.GovernmentPolitics,
        EventCategory.Automotive,
        EventCategory.Other,
    ],
};

export const getAllCategories = (): CategoryInfo[] => {
    return Object.values(EventCategory).map((category) => ({
        value: category,
        description: CATEGORY_DESCRIPTIONS[category],
        group: getGroupForCategory(category),
    }));
};

export const getGroupForCategory = (category: EventCategory): string => {
    for (const [groupName, categories] of Object.entries(CATEGORY_GROUPS)) {
        if (categories.includes(category)) {
            return groupName;
        }
    }
    return 'Other';
};

export const getCategoriesByGroup = (): Record<string, CategoryInfo[]> => {
    const result: Record<string, CategoryInfo[]> = {};

    for (const [groupName, categories] of Object.entries(CATEGORY_GROUPS)) {
        result[groupName] = categories.map((category) => ({
            value: category,
            description: CATEGORY_DESCRIPTIONS[category],
            group: groupName,
        }));
    }

    return result;
};

export const searchCategories = (searchTerm: string): CategoryInfo[] => {
    const term = searchTerm.toLowerCase();
    return getAllCategories().filter(
        (category) =>
            category.description.toLowerCase().includes(term) ||
            category.value.toLowerCase().includes(term) ||
            category.group.toLowerCase().includes(term)
    );
};

export const fromString = (categoryString: string): EventCategory | null => {
    const category = Object.values(EventCategory).find(
        (cat) => cat.toLowerCase() === categoryString.toLowerCase()
    );
    return category || null;
};

export const fromStringList = (categoryStrings: string[]): EventCategory[] => {
    return categoryStrings
        .map((str) => fromString(str))
        .filter((cat): cat is EventCategory => cat !== null);
};

// Legacy mapping for backward compatibility with existing hardcoded categories
export const LEGACY_CATEGORY_MAPPING: Record<string, EventCategory> = {
    Tech: EventCategory.TechnologyInnovation,
    Art: EventCategory.ArtsCulture,
    Concerts: EventCategory.MusicEntertainment,
    Parties: EventCategory.MusicEntertainment,
    Culture: EventCategory.ArtsCulture,
    Business: EventCategory.BusinessProfessional,
    'Food & Drinks': EventCategory.FoodDrink,
    Dating: EventCategory.CommunitySocial,
};

export const mapLegacyCategory = (
    legacyCategory: string
): EventCategory | null => {
    return (
        LEGACY_CATEGORY_MAPPING[legacyCategory] || fromString(legacyCategory)
    );
};
