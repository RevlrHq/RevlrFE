import { useState, useCallback, useMemo } from 'react';
import {
    EventCategory,
    CategoryInfo,
    getAllCategories,
    getCategoriesByGroup,
    searchCategories,
    fromStringList,
    mapLegacyCategory,
    CATEGORY_DESCRIPTIONS,
} from '../lib/constants/eventCategories';

export interface CategoryFilterState {
    selectedCategories: EventCategory[];
    selectedGroups: string[];
    searchTerm: string;
    showGrouped: boolean;
}

export interface CategoryFilterActions {
    toggleCategory: (category: EventCategory) => void;
    toggleGroup: (groupName: string) => void;
    selectMultipleCategories: (categories: EventCategory[]) => void;
    clearCategories: () => void;
    setSearchTerm: (term: string) => void;
    setShowGrouped: (grouped: boolean) => void;
    selectLegacyCategory: (legacyCategory: string) => void;
    selectCategoriesFromStrings: (categoryStrings: string[]) => void;
}

export interface CategoryFilterData {
    allCategories: CategoryInfo[];
    categoriesByGroup: Record<string, CategoryInfo[]>;
    filteredCategories: CategoryInfo[];
    selectedCategoryDescriptions: string[];
    hasActiveFilters: boolean;
}

export interface UseCategoryFilterResult {
    state: CategoryFilterState;
    actions: CategoryFilterActions;
    data: CategoryFilterData;
}

export const useCategoryFilter = (
    initialCategories: EventCategory[] = [],
    initialShowGrouped: boolean = false
): UseCategoryFilterResult => {
    const [selectedCategories, setSelectedCategories] =
        useState<EventCategory[]>(initialCategories);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showGrouped, setShowGrouped] = useState(initialShowGrouped);

    // Memoized data
    const allCategories = useMemo(() => getAllCategories(), []);
    const categoriesByGroup = useMemo(() => getCategoriesByGroup(), []);

    const filteredCategories = useMemo(() => {
        if (!searchTerm) return allCategories;
        return searchCategories(searchTerm);
    }, [allCategories, searchTerm]);

    const selectedCategoryDescriptions = useMemo(() => {
        return selectedCategories.map((cat) => CATEGORY_DESCRIPTIONS[cat]);
    }, [selectedCategories]);

    const hasActiveFilters = useMemo(() => {
        return selectedCategories.length > 0 || selectedGroups.length > 0;
    }, [selectedCategories, selectedGroups]);

    // Actions
    const toggleCategory = useCallback((category: EventCategory) => {
        setSelectedCategories((prev) => {
            const isSelected = prev.includes(category);
            if (isSelected) {
                return prev.filter((cat) => cat !== category);
            } else {
                return [...prev, category];
            }
        });
    }, []);

    const toggleGroup = useCallback(
        (groupName: string) => {
            const groupCategories =
                categoriesByGroup[groupName]?.map((cat) => cat.value) || [];

            setSelectedGroups((prev) => {
                const isSelected = prev.includes(groupName);
                if (isSelected) {
                    // Remove group and its categories
                    setSelectedCategories((current) =>
                        current.filter((cat) => !groupCategories.includes(cat))
                    );
                    return prev.filter((group) => group !== groupName);
                } else {
                    // Add group and its categories
                    setSelectedCategories((current) => {
                        const newCategories = groupCategories.filter(
                            (cat) => !current.includes(cat)
                        );
                        return [...current, ...newCategories];
                    });
                    return [...prev, groupName];
                }
            });
        },
        [categoriesByGroup]
    );

    const selectMultipleCategories = useCallback(
        (categories: EventCategory[]) => {
            setSelectedCategories(categories);
            // Update selected groups based on new categories
            const newSelectedGroups: string[] = [];
            Object.entries(categoriesByGroup).forEach(
                ([groupName, groupCategories]) => {
                    const groupCategoryValues = groupCategories.map(
                        (cat) => cat.value
                    );
                    const isGroupFullySelected = groupCategoryValues.every(
                        (cat) => categories.includes(cat)
                    );
                    if (isGroupFullySelected) {
                        newSelectedGroups.push(groupName);
                    }
                }
            );
            setSelectedGroups(newSelectedGroups);
        },
        [categoriesByGroup]
    );

    const clearCategories = useCallback(() => {
        setSelectedCategories([]);
        setSelectedGroups([]);
    }, []);

    const selectLegacyCategory = useCallback(
        (legacyCategory: string) => {
            const mappedCategory = mapLegacyCategory(legacyCategory);
            if (mappedCategory) {
                toggleCategory(mappedCategory);
            }
        },
        [toggleCategory]
    );

    const selectCategoriesFromStrings = useCallback(
        (categoryStrings: string[]) => {
            const categories = fromStringList(categoryStrings);
            selectMultipleCategories(categories);
        },
        [selectMultipleCategories]
    );

    return {
        state: {
            selectedCategories,
            selectedGroups,
            searchTerm,
            showGrouped,
        },
        actions: {
            toggleCategory,
            toggleGroup,
            selectMultipleCategories,
            clearCategories,
            setSearchTerm,
            setShowGrouped,
            selectLegacyCategory,
            selectCategoriesFromStrings,
        },
        data: {
            allCategories,
            categoriesByGroup,
            filteredCategories,
            selectedCategoryDescriptions,
            hasActiveFilters,
        },
    };
};

// Helper hook for converting category filter to API parameters
export const useCategoryFilterToApi = (categoryFilter: CategoryFilterState) => {
    return useMemo(() => {
        if (categoryFilter.selectedCategories.length === 0) {
            return {};
        }

        if (categoryFilter.selectedCategories.length === 1) {
            // Single category for backward compatibility
            return {
                category: categoryFilter.selectedCategories[0],
            };
        }

        // Multiple categories
        return {
            categories: categoryFilter.selectedCategories,
        };
    }, [categoryFilter.selectedCategories]);
};
