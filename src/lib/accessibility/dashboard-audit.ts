/**
 * Comprehensive accessibility audit system for the dashboard
 */

interface AccessibilityIssue {
    id: string;
    severity: 'error' | 'warning' | 'info';
    rule: string;
    description: string;
    element: string;
    selector: string;
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    helpUrl?: string;
    suggestions: string[];
}

interface AccessibilityReport {
    timestamp: number;
    url: string;
    totalIssues: number;
    issuesBySeverity: Record<string, number>;
    issuesByRule: Record<string, number>;
    issues: AccessibilityIssue[];
    score: number;
    recommendations: string[];
}

class DashboardAccessibilityAuditor {
    private issues: AccessibilityIssue[] = [];
    private isRunning = false;

    async runAudit(): Promise<AccessibilityReport> {
        if (this.isRunning) {
            throw new Error('Audit already in progress');
        }

        this.isRunning = true;
        this.issues = [];

        try {
            // Run various accessibility checks
            await this.checkKeyboardNavigation();
            await this.checkAriaLabels();
            await this.checkColorContrast();
            await this.checkHeadingStructure();
            await this.checkFormLabels();
            await this.checkImageAltText();
            await this.checkFocusManagement();
            await this.checkScreenReaderSupport();
            await this.checkSemanticStructure();
            await this.checkInteractiveElements();

            // Generate report
            const report = this.generateReport();

            // Log results
            console.log('Dashboard Accessibility Audit Complete:', report);

            return report;
        } finally {
            this.isRunning = false;
        }
    }

    private async checkKeyboardNavigation() {
        const interactiveElements = document.querySelectorAll(
            'button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]'
        );

        interactiveElements.forEach((element) => {
            const htmlElement = element as HTMLElement;

            // Check if element is focusable
            if (
                htmlElement.tabIndex < 0 &&
                !htmlElement.hasAttribute('aria-hidden')
            ) {
                this.addIssue({
                    rule: 'keyboard-navigation',
                    severity: 'error',
                    impact: 'serious',
                    description:
                        'Interactive element is not keyboard accessible',
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Add tabindex="0" to make element focusable',
                        'Ensure element can be activated with Enter or Space key',
                        'Provide visible focus indicators',
                    ],
                });
            }

            // Check for focus indicators
            const computedStyle = window.getComputedStyle(
                htmlElement,
                ':focus'
            );
            if (
                computedStyle.outline === 'none' &&
                computedStyle.boxShadow === 'none'
            ) {
                this.addIssue({
                    rule: 'focus-indicators',
                    severity: 'warning',
                    impact: 'moderate',
                    description:
                        'Interactive element lacks visible focus indicator',
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Add CSS focus styles (outline or box-shadow)',
                        'Ensure focus indicators have sufficient contrast',
                        'Test focus visibility across different themes',
                    ],
                });
            }
        });
    }

    private async checkAriaLabels() {
        const elementsNeedingLabels = document.querySelectorAll(
            'button:not([aria-label]):not([aria-labelledby]), ' +
                'input:not([aria-label]):not([aria-labelledby]):not([id]), ' +
                '[role="button"]:not([aria-label]):not([aria-labelledby])'
        );

        elementsNeedingLabels.forEach((element) => {
            const htmlElement = element as HTMLElement;
            const textContent = htmlElement.textContent?.trim();

            if (!textContent || textContent.length < 2) {
                this.addIssue({
                    rule: 'aria-labels',
                    severity: 'error',
                    impact: 'critical',
                    description: 'Interactive element lacks accessible name',
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Add aria-label attribute with descriptive text',
                        'Add aria-labelledby pointing to descriptive element',
                        'Ensure button text is descriptive and meaningful',
                    ],
                });
            }
        });

        // Check for proper ARIA roles
        const elementsWithRoles = document.querySelectorAll('[role]');
        elementsWithRoles.forEach((element) => {
            const htmlElement = element as HTMLElement;
            const role = htmlElement.getAttribute('role');
            const validRoles = [
                'button',
                'link',
                'tab',
                'tabpanel',
                'dialog',
                'alert',
                'status',
                'region',
                'navigation',
                'main',
                'banner',
                'contentinfo',
                'complementary',
            ];

            if (role && !validRoles.includes(role)) {
                this.addIssue({
                    rule: 'valid-aria-roles',
                    severity: 'warning',
                    impact: 'moderate',
                    description: `Invalid or non-standard ARIA role: ${role}`,
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Use standard ARIA roles from the specification',
                        'Remove invalid role attributes',
                        'Consider using semantic HTML elements instead',
                    ],
                });
            }
        });
    }

    private async checkColorContrast() {
        const textElements = document.querySelectorAll(
            'p, span, div, h1, h2, h3, h4, h5, h6, button, a, label'
        );

        textElements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            const computedStyle = window.getComputedStyle(htmlElement);

            // Skip if no text content
            if (!htmlElement.textContent?.trim()) return;

            // Basic contrast check (simplified)
            const contrastRatio = this.calculateContrastRatio();
            const fontSize = parseFloat(computedStyle.fontSize);
            const fontWeight = computedStyle.fontWeight;

            const isLargeText =
                fontSize >= 18 ||
                (fontSize >= 14 &&
                    (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
            const minRatio = isLargeText ? 3 : 4.5;

            if (contrastRatio < minRatio) {
                this.addIssue({
                    rule: 'color-contrast',
                    severity: 'error',
                    impact: 'serious',
                    description: `Insufficient color contrast ratio: ${contrastRatio.toFixed(2)}:1 (minimum: ${minRatio}:1)`,
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Increase contrast between text and background colors',
                        'Use darker text on light backgrounds or lighter text on dark backgrounds',
                        'Test colors with accessibility tools',
                    ],
                });
            }
        });
    }

    private async checkHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        let hasH1 = false;

        headings.forEach((heading) => {
            const htmlElement = heading as HTMLElement;
            const level = parseInt(htmlElement.tagName.charAt(1));

            if (level === 1) {
                if (hasH1) {
                    this.addIssue({
                        rule: 'heading-structure',
                        severity: 'warning',
                        impact: 'moderate',
                        description: 'Multiple H1 elements found on page',
                        element: htmlElement.tagName.toLowerCase(),
                        selector: this.getSelector(htmlElement),
                        suggestions: [
                            'Use only one H1 per page',
                            'Use H2-H6 for subsections',
                            'Maintain logical heading hierarchy',
                        ],
                    });
                }
                hasH1 = true;
            }

            if (previousLevel > 0 && level > previousLevel + 1) {
                this.addIssue({
                    rule: 'heading-structure',
                    severity: 'warning',
                    impact: 'moderate',
                    description: `Heading level skipped from H${previousLevel} to H${level}`,
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Use sequential heading levels (H1, H2, H3, etc.)',
                        'Do not skip heading levels',
                        'Use CSS for visual styling, not heading levels',
                    ],
                });
            }

            previousLevel = level;
        });

        if (!hasH1) {
            this.addIssue({
                rule: 'heading-structure',
                severity: 'error',
                impact: 'serious',
                description: 'Page is missing an H1 heading',
                element: 'page',
                selector: 'html',
                suggestions: [
                    'Add an H1 heading to identify the main content',
                    'Ensure H1 describes the page purpose',
                    'Place H1 near the beginning of the main content',
                ],
            });
        }
    }

    private async checkFormLabels() {
        const formControls = document.querySelectorAll(
            'input, select, textarea'
        );

        formControls.forEach((control) => {
            const htmlElement = control as HTMLInputElement;
            const id = htmlElement.id;
            const type = htmlElement.type;

            // Skip hidden inputs
            if (type === 'hidden') return;

            let hasLabel = false;

            // Check for associated label
            if (id) {
                const label = document.querySelector(`label[for="${id}"]`);
                if (label) hasLabel = true;
            }

            // Check for aria-label or aria-labelledby
            if (
                htmlElement.hasAttribute('aria-label') ||
                htmlElement.hasAttribute('aria-labelledby')
            ) {
                hasLabel = true;
            }

            // Check for wrapping label
            const parentLabel = htmlElement.closest('label');
            if (parentLabel) hasLabel = true;

            if (!hasLabel) {
                this.addIssue({
                    rule: 'form-labels',
                    severity: 'error',
                    impact: 'critical',
                    description: 'Form control lacks accessible label',
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Add a label element associated with the form control',
                        'Use aria-label for programmatic labels',
                        'Use aria-labelledby to reference descriptive text',
                    ],
                });
            }
        });
    }

    private async checkImageAltText() {
        const images = document.querySelectorAll('img');

        images.forEach((img) => {
            const htmlElement = img as HTMLImageElement;
            const alt = htmlElement.alt;

            // Skip decorative images with empty alt
            if (alt === '') return;

            if (!htmlElement.hasAttribute('alt')) {
                this.addIssue({
                    rule: 'image-alt',
                    severity: 'error',
                    impact: 'serious',
                    description: 'Image lacks alt attribute',
                    element: 'img',
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Add alt attribute with descriptive text',
                        'Use empty alt="" for decorative images',
                        'Describe the image content and purpose',
                    ],
                });
            } else if (
                alt &&
                (alt.toLowerCase().includes('image') ||
                    alt.toLowerCase().includes('picture'))
            ) {
                this.addIssue({
                    rule: 'image-alt',
                    severity: 'warning',
                    impact: 'minor',
                    description:
                        'Alt text contains redundant words like "image" or "picture"',
                    element: 'img',
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Remove redundant words from alt text',
                        'Focus on describing the image content',
                        'Keep alt text concise and meaningful',
                    ],
                });
            }
        });
    }

    private async checkFocusManagement() {
        // Check for focus traps in modals
        const modals = document.querySelectorAll(
            '[role="dialog"], .modal, [data-modal]'
        );

        modals.forEach((modal) => {
            const htmlElement = modal as HTMLElement;
            const focusableElements = htmlElement.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length === 0) {
                this.addIssue({
                    rule: 'focus-management',
                    severity: 'error',
                    impact: 'serious',
                    description: 'Modal lacks focusable elements',
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Ensure modals contain focusable elements',
                        'Implement proper focus trapping',
                        'Return focus to trigger element when modal closes',
                    ],
                });
            }
        });
    }

    private async checkScreenReaderSupport() {
        // Check for live regions - currently unused but kept for future implementation

        // Check for proper announcements
        const dynamicContent = document.querySelectorAll(
            '[data-dynamic], .loading, .error'
        );
        dynamicContent.forEach((element) => {
            const htmlElement = element as HTMLElement;
            const hasLiveRegion =
                htmlElement.hasAttribute('aria-live') ||
                htmlElement.hasAttribute('role');

            if (!hasLiveRegion) {
                this.addIssue({
                    rule: 'screen-reader-support',
                    severity: 'warning',
                    impact: 'moderate',
                    description:
                        'Dynamic content lacks screen reader announcements',
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Add aria-live="polite" for non-urgent updates',
                        'Add aria-live="assertive" for urgent updates',
                        'Use role="status" for status messages',
                    ],
                });
            }
        });
    }

    private async checkSemanticStructure() {
        // Check for landmark roles
        const landmarks = document.querySelectorAll(
            'main, nav, header, footer, aside, section, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"]'
        );

        if (landmarks.length === 0) {
            this.addIssue({
                rule: 'semantic-structure',
                severity: 'warning',
                impact: 'moderate',
                description: 'Page lacks semantic landmarks',
                element: 'page',
                selector: 'html',
                suggestions: [
                    'Use semantic HTML5 elements (main, nav, header, footer)',
                    'Add ARIA landmark roles where appropriate',
                    'Structure content with meaningful sections',
                ],
            });
        }

        // Check for proper list structure
        const lists = document.querySelectorAll('ul, ol');
        lists.forEach((list) => {
            const htmlElement = list as HTMLElement;
            const listItems = htmlElement.querySelectorAll(':scope > li');

            if (listItems.length === 0) {
                this.addIssue({
                    rule: 'semantic-structure',
                    severity: 'warning',
                    impact: 'minor',
                    description: 'List element contains no list items',
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Remove empty list elements',
                        'Ensure lists contain li elements',
                        'Use appropriate list types (ul, ol, dl)',
                    ],
                });
            }
        });
    }

    private async checkInteractiveElements() {
        const buttons = document.querySelectorAll('button, [role="button"]');

        buttons.forEach((button) => {
            const htmlElement = button as HTMLElement;
            const textContent = htmlElement.textContent?.trim();

            if (!textContent || textContent.length < 2) {
                this.addIssue({
                    rule: 'interactive-elements',
                    severity: 'error',
                    impact: 'serious',
                    description: 'Button lacks descriptive text content',
                    element: htmlElement.tagName.toLowerCase(),
                    selector: this.getSelector(htmlElement),
                    suggestions: [
                        'Add descriptive text to buttons',
                        'Use aria-label for icon-only buttons',
                        'Ensure button purpose is clear from text',
                    ],
                });
            }
        });
    }

    private addIssue(issue: Omit<AccessibilityIssue, 'id'>) {
        this.issues.push({
            id: `${issue.rule}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...issue,
        });
    }

    private getSelector(element: HTMLElement): string {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ')[0]}`;
        return element.tagName.toLowerCase();
    }

    private calculateContrastRatio(): number {
        // Simplified contrast calculation
        // In a real implementation, you'd use a proper color contrast library
        return 4.5; // Placeholder value
    }

    private generateReport(): AccessibilityReport {
        const issuesBySeverity = this.issues.reduce(
            (acc, issue) => {
                acc[issue.severity] = (acc[issue.severity] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const issuesByRule = this.issues.reduce(
            (acc, issue) => {
                acc[issue.rule] = (acc[issue.rule] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        // Calculate accessibility score (0-100)
        const totalIssues = this.issues.length;
        const errorWeight = 10;
        const warningWeight = 5;
        const infoWeight = 1;

        const weightedScore =
            (issuesBySeverity.error || 0) * errorWeight +
            (issuesBySeverity.warning || 0) * warningWeight +
            (issuesBySeverity.info || 0) * infoWeight;

        const score = Math.max(0, 100 - weightedScore);

        const recommendations = this.generateRecommendations();

        return {
            timestamp: Date.now(),
            url: window.location.href,
            totalIssues,
            issuesBySeverity,
            issuesByRule,
            issues: this.issues,
            score,
            recommendations,
        };
    }

    private generateRecommendations(): string[] {
        const recommendations: string[] = [];

        if (this.issues.some((i) => i.rule === 'keyboard-navigation')) {
            recommendations.push(
                'Improve keyboard navigation by ensuring all interactive elements are focusable and have visible focus indicators'
            );
        }

        if (this.issues.some((i) => i.rule === 'color-contrast')) {
            recommendations.push(
                'Increase color contrast ratios to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)'
            );
        }

        if (this.issues.some((i) => i.rule === 'aria-labels')) {
            recommendations.push(
                'Add proper ARIA labels and descriptions to improve screen reader compatibility'
            );
        }

        if (this.issues.some((i) => i.rule === 'heading-structure')) {
            recommendations.push(
                'Organize content with proper heading hierarchy (H1-H6) for better navigation'
            );
        }

        if (this.issues.some((i) => i.rule === 'form-labels')) {
            recommendations.push(
                'Associate all form controls with descriptive labels'
            );
        }

        return recommendations;
    }
}

// Export singleton instance
export const dashboardAccessibilityAuditor =
    new DashboardAccessibilityAuditor();

// React hook for accessibility auditing
export const useAccessibilityAudit = () => {
    return {
        runAudit: () => dashboardAccessibilityAuditor.runAudit(),
    };
};
