/**
 * Accessibility audit utilities for settings
 * Provides automated accessibility checks and recommendations
 */

export interface AccessibilityIssue {
    type: 'error' | 'warning' | 'info';
    rule: string;
    description: string;
    element?: Element;
    selector?: string;
    recommendation: string;
    wcagLevel: 'A' | 'AA' | 'AAA';
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface AccessibilityAuditResult {
    issues: AccessibilityIssue[];
    score: number; // 0-100
    summary: {
        errors: number;
        warnings: number;
        info: number;
        total: number;
    };
    recommendations: string[];
}

class AccessibilityAuditor {
    private container: Element;

    constructor(container: Element = document.body) {
        this.container = container;
    }

    /**
     * Run comprehensive accessibility audit
     */
    audit(): AccessibilityAuditResult {
        const issues: AccessibilityIssue[] = [
            ...this.checkHeadingStructure(),
            ...this.checkFormLabels(),
            ...this.checkColorContrast(),
            ...this.checkKeyboardNavigation(),
            ...this.checkAriaLabels(),
            ...this.checkFocusManagement(),
            ...this.checkImageAltText(),
            ...this.checkLinkAccessibility(),
            ...this.checkButtonAccessibility(),
            ...this.checkTableAccessibility(),
            ...this.checkLandmarkRoles(),
            ...this.checkSkipLinks(),
        ];

        const summary = {
            errors: issues.filter((i) => i.type === 'error').length,
            warnings: issues.filter((i) => i.type === 'warning').length,
            info: issues.filter((i) => i.type === 'info').length,
            total: issues.length,
        };

        const score = this.calculateScore(issues);
        const recommendations = this.generateRecommendations(issues);

        return {
            issues,
            score,
            summary,
            recommendations,
        };
    }

    /**
     * Check heading structure (h1-h6)
     */
    private checkHeadingStructure(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const headings = this.container.querySelectorAll(
            'h1, h2, h3, h4, h5, h6'
        );

        let previousLevel = 0;
        headings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));

            // Check for missing h1
            if (index === 0 && level !== 1) {
                issues.push({
                    type: 'warning',
                    rule: 'heading-structure',
                    description: 'Page should start with h1',
                    element: heading,
                    selector: heading.tagName.toLowerCase(),
                    recommendation:
                        'Add an h1 element at the beginning of the page',
                    wcagLevel: 'AA',
                    impact: 'moderate',
                });
            }

            // Check for skipped heading levels
            if (level > previousLevel + 1) {
                issues.push({
                    type: 'error',
                    rule: 'heading-order',
                    description: `Heading level skipped from h${previousLevel} to h${level}`,
                    element: heading,
                    selector: `${heading.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
                    recommendation: `Use h${previousLevel + 1} instead of h${level}`,
                    wcagLevel: 'AA',
                    impact: 'serious',
                });
            }

            previousLevel = level;
        });

        return issues;
    }

    /**
     * Check form labels and accessibility
     */
    private checkFormLabels(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const formControls = this.container.querySelectorAll(
            'input, select, textarea'
        );

        formControls.forEach((control) => {
            const id = control.getAttribute('id');
            const ariaLabel = control.getAttribute('aria-label');
            const ariaLabelledby = control.getAttribute('aria-labelledby');
            const label = id
                ? this.container.querySelector(`label[for="${id}"]`)
                : null;

            if (!label && !ariaLabel && !ariaLabelledby) {
                issues.push({
                    type: 'error',
                    rule: 'form-label',
                    description: 'Form control missing accessible label',
                    element: control,
                    selector: this.getSelector(control),
                    recommendation:
                        'Add a label element, aria-label, or aria-labelledby attribute',
                    wcagLevel: 'A',
                    impact: 'critical',
                });
            }

            // Check for placeholder-only labels
            const placeholder = control.getAttribute('placeholder');
            if (placeholder && !label && !ariaLabel && !ariaLabelledby) {
                issues.push({
                    type: 'warning',
                    rule: 'placeholder-label',
                    description: 'Using placeholder as label is not accessible',
                    element: control,
                    selector: this.getSelector(control),
                    recommendation:
                        'Add a proper label in addition to placeholder text',
                    wcagLevel: 'AA',
                    impact: 'moderate',
                });
            }
        });

        return issues;
    }

    /**
     * Check color contrast (basic check)
     */
    private checkColorContrast(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const textElements = this.container.querySelectorAll(
            'p, span, div, h1, h2, h3, h4, h5, h6, a, button, label'
        );

        textElements.forEach((element) => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;

            // Skip if no text content
            if (!element.textContent?.trim()) return;

            // Basic contrast check (simplified)
            if (color === backgroundColor) {
                issues.push({
                    type: 'error',
                    rule: 'color-contrast',
                    description: 'Text color same as background color',
                    element: element,
                    selector: this.getSelector(element),
                    recommendation:
                        'Ensure sufficient color contrast between text and background',
                    wcagLevel: 'AA',
                    impact: 'critical',
                });
            }
        });

        return issues;
    }

    /**
     * Check keyboard navigation
     */
    private checkKeyboardNavigation(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const interactiveElements = this.container.querySelectorAll(
            'a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]'
        );

        interactiveElements.forEach((element) => {
            const tabIndex = element.getAttribute('tabindex');

            // Check for positive tabindex (anti-pattern)
            if (tabIndex && parseInt(tabIndex) > 0) {
                issues.push({
                    type: 'warning',
                    rule: 'tabindex-positive',
                    description:
                        'Positive tabindex can disrupt natural tab order',
                    element: element,
                    selector: this.getSelector(element),
                    recommendation:
                        'Use tabindex="0" or remove tabindex to maintain natural order',
                    wcagLevel: 'A',
                    impact: 'moderate',
                });
            }

            // Check for missing focus indicators
            const styles = window.getComputedStyle(element, ':focus');
            if (
                styles.outline === 'none' &&
                !styles.boxShadow &&
                !styles.border
            ) {
                issues.push({
                    type: 'warning',
                    rule: 'focus-indicator',
                    description:
                        'Interactive element may lack visible focus indicator',
                    element: element,
                    selector: this.getSelector(element),
                    recommendation:
                        'Ensure focus indicators are visible and meet contrast requirements',
                    wcagLevel: 'AA',
                    impact: 'moderate',
                });
            }
        });

        return issues;
    }

    /**
     * Check ARIA labels and roles
     */
    private checkAriaLabels(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const elementsWithAria = this.container.querySelectorAll(
            '[aria-label], [aria-labelledby], [role]'
        );

        elementsWithAria.forEach((element) => {
            const ariaLabel = element.getAttribute('aria-label');
            const ariaLabelledby = element.getAttribute('aria-labelledby');
            const role = element.getAttribute('role');

            // Check for empty aria-label
            if (ariaLabel === '') {
                issues.push({
                    type: 'error',
                    rule: 'aria-label-empty',
                    description: 'Empty aria-label attribute',
                    element: element,
                    selector: this.getSelector(element),
                    recommendation:
                        'Provide meaningful aria-label text or remove the attribute',
                    wcagLevel: 'A',
                    impact: 'serious',
                });
            }

            // Check for invalid aria-labelledby references
            if (ariaLabelledby) {
                const referencedIds = ariaLabelledby.split(' ');
                referencedIds.forEach((id) => {
                    if (!document.getElementById(id)) {
                        issues.push({
                            type: 'error',
                            rule: 'aria-labelledby-invalid',
                            description: `aria-labelledby references non-existent id: ${id}`,
                            element: element,
                            selector: this.getSelector(element),
                            recommendation:
                                'Ensure all referenced IDs exist in the document',
                            wcagLevel: 'A',
                            impact: 'serious',
                        });
                    }
                });
            }

            // Check for invalid roles
            const validRoles = [
                'alert',
                'alertdialog',
                'application',
                'article',
                'banner',
                'button',
                'cell',
                'checkbox',
                'columnheader',
                'combobox',
                'complementary',
                'contentinfo',
                'dialog',
                'directory',
                'document',
                'feed',
                'figure',
                'form',
                'grid',
                'gridcell',
                'group',
                'heading',
                'img',
                'link',
                'list',
                'listbox',
                'listitem',
                'log',
                'main',
                'marquee',
                'math',
                'menu',
                'menubar',
                'menuitem',
                'menuitemcheckbox',
                'menuitemradio',
                'navigation',
                'none',
                'note',
                'option',
                'presentation',
                'progressbar',
                'radio',
                'radiogroup',
                'region',
                'row',
                'rowgroup',
                'rowheader',
                'scrollbar',
                'search',
                'searchbox',
                'separator',
                'slider',
                'spinbutton',
                'status',
                'switch',
                'tab',
                'table',
                'tablist',
                'tabpanel',
                'term',
                'textbox',
                'timer',
                'toolbar',
                'tooltip',
                'tree',
                'treegrid',
                'treeitem',
            ];

            if (role && !validRoles.includes(role)) {
                issues.push({
                    type: 'error',
                    rule: 'invalid-role',
                    description: `Invalid ARIA role: ${role}`,
                    element: element,
                    selector: this.getSelector(element),
                    recommendation:
                        'Use a valid ARIA role or remove the role attribute',
                    wcagLevel: 'A',
                    impact: 'serious',
                });
            }
        });

        return issues;
    }

    /**
     * Check focus management
     */
    private checkFocusManagement(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];

        // Check for focus traps in modals
        const modals = this.container.querySelectorAll(
            '[role="dialog"], .modal, [aria-modal="true"]'
        );
        modals.forEach((modal) => {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length === 0) {
                issues.push({
                    type: 'warning',
                    rule: 'modal-focus',
                    description: 'Modal contains no focusable elements',
                    element: modal,
                    selector: this.getSelector(modal),
                    recommendation:
                        'Ensure modals contain at least one focusable element',
                    wcagLevel: 'AA',
                    impact: 'moderate',
                });
            }
        });

        return issues;
    }

    /**
     * Check image alt text
     */
    private checkImageAltText(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const images = this.container.querySelectorAll('img');

        images.forEach((img) => {
            const alt = img.getAttribute('alt');
            const role = img.getAttribute('role');

            if (alt === null && role !== 'presentation') {
                issues.push({
                    type: 'error',
                    rule: 'img-alt',
                    description: 'Image missing alt attribute',
                    element: img,
                    selector: this.getSelector(img),
                    recommendation:
                        'Add alt attribute with descriptive text or alt="" for decorative images',
                    wcagLevel: 'A',
                    impact: 'serious',
                });
            }
        });

        return issues;
    }

    /**
     * Check link accessibility
     */
    private checkLinkAccessibility(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const links = this.container.querySelectorAll('a');

        links.forEach((link) => {
            const href = link.getAttribute('href');
            const textContent = link.textContent?.trim();
            const ariaLabel = link.getAttribute('aria-label');

            // Check for empty links
            if (!textContent && !ariaLabel) {
                issues.push({
                    type: 'error',
                    rule: 'link-name',
                    description: 'Link has no accessible name',
                    element: link,
                    selector: this.getSelector(link),
                    recommendation:
                        'Add descriptive text content or aria-label',
                    wcagLevel: 'A',
                    impact: 'critical',
                });
            }

            // Check for generic link text
            const genericTexts = [
                'click here',
                'read more',
                'more',
                'here',
                'link',
            ];
            if (
                textContent &&
                genericTexts.includes(textContent.toLowerCase())
            ) {
                issues.push({
                    type: 'warning',
                    rule: 'link-context',
                    description: 'Link text is not descriptive',
                    element: link,
                    selector: this.getSelector(link),
                    recommendation:
                        'Use descriptive link text that makes sense out of context',
                    wcagLevel: 'AA',
                    impact: 'moderate',
                });
            }
        });

        return issues;
    }

    /**
     * Check button accessibility
     */
    private checkButtonAccessibility(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const buttons = this.container.querySelectorAll(
            'button, [role="button"]'
        );

        buttons.forEach((button) => {
            const textContent = button.textContent?.trim();
            const ariaLabel = button.getAttribute('aria-label');

            if (!textContent && !ariaLabel) {
                issues.push({
                    type: 'error',
                    rule: 'button-name',
                    description: 'Button has no accessible name',
                    element: button,
                    selector: this.getSelector(button),
                    recommendation:
                        'Add text content or aria-label to describe button purpose',
                    wcagLevel: 'A',
                    impact: 'critical',
                });
            }
        });

        return issues;
    }

    /**
     * Check table accessibility
     */
    private checkTableAccessibility(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];
        const tables = this.container.querySelectorAll('table');

        tables.forEach((table) => {
            const caption = table.querySelector('caption');
            const headers = table.querySelectorAll('th');

            if (!caption) {
                issues.push({
                    type: 'warning',
                    rule: 'table-caption',
                    description: 'Table missing caption',
                    element: table,
                    selector: this.getSelector(table),
                    recommendation:
                        'Add a caption element to describe the table content',
                    wcagLevel: 'AA',
                    impact: 'moderate',
                });
            }

            if (headers.length === 0) {
                issues.push({
                    type: 'error',
                    rule: 'table-headers',
                    description: 'Table missing header cells',
                    element: table,
                    selector: this.getSelector(table),
                    recommendation: 'Use th elements for table headers',
                    wcagLevel: 'A',
                    impact: 'serious',
                });
            }
        });

        return issues;
    }

    /**
     * Check landmark roles
     */
    private checkLandmarkRoles(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];

        const main = this.container.querySelector('main, [role="main"]');
        if (!main) {
            issues.push({
                type: 'warning',
                rule: 'landmark-main',
                description: 'Page missing main landmark',
                selector: 'body',
                recommendation:
                    'Add a main element or role="main" to identify the main content area',
                wcagLevel: 'AA',
                impact: 'moderate',
            });
        }

        return issues;
    }

    /**
     * Check skip links
     */
    private checkSkipLinks(): AccessibilityIssue[] {
        const issues: AccessibilityIssue[] = [];

        const skipLink = document.querySelector('a[href^="#"]:first-child');
        if (
            !skipLink ||
            !skipLink.textContent?.toLowerCase().includes('skip')
        ) {
            issues.push({
                type: 'info',
                rule: 'skip-link',
                description: 'Consider adding skip navigation link',
                selector: 'body',
                recommendation:
                    'Add a skip link as the first focusable element to help keyboard users',
                wcagLevel: 'AA',
                impact: 'minor',
            });
        }

        return issues;
    }

    /**
     * Calculate accessibility score
     */
    private calculateScore(issues: AccessibilityIssue[]): number {
        let score = 100;

        issues.forEach((issue) => {
            switch (issue.impact) {
                case 'critical':
                    score -= 15;
                    break;
                case 'serious':
                    score -= 10;
                    break;
                case 'moderate':
                    score -= 5;
                    break;
                case 'minor':
                    score -= 2;
                    break;
            }
        });

        return Math.max(0, score);
    }

    /**
     * Generate recommendations
     */
    private generateRecommendations(issues: AccessibilityIssue[]): string[] {
        const recommendations = new Set<string>();

        issues.forEach((issue) => {
            recommendations.add(issue.recommendation);
        });

        return Array.from(recommendations);
    }

    /**
     * Get CSS selector for element
     */
    private getSelector(element: Element): string {
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.className) {
            const classes = element.className
                .split(' ')
                .filter((c) => c.trim());
            if (classes.length > 0) {
                return `${element.tagName.toLowerCase()}.${classes.join('.')}`;
            }
        }

        return element.tagName.toLowerCase();
    }
}

/**
 * Run accessibility audit on settings page
 */
export function auditSettingsAccessibility(
    container?: Element
): AccessibilityAuditResult {
    const auditor = new AccessibilityAuditor(container);
    return auditor.audit();
}

/**
 * React hook for accessibility monitoring
 */
export function useAccessibilityMonitor(enabled: boolean = true) {
    const [auditResult, setAuditResult] =
        React.useState<AccessibilityAuditResult | null>(null);

    React.useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        const runAudit = () => {
            const result = auditSettingsAccessibility();
            setAuditResult(result);

            // Log issues in development
            if (
                process.env.NODE_ENV === 'development' &&
                result.issues.length > 0
            ) {
                console.group('Accessibility Issues Found:');
                result.issues.forEach((issue) => {
                    console.warn(
                        `${issue.type.toUpperCase()}: ${issue.description}`,
                        issue.element
                    );
                });
                console.groupEnd();
            }
        };

        // Run initial audit
        runAudit();

        // Re-run audit when DOM changes
        const observer = new MutationObserver(() => {
            setTimeout(runAudit, 100); // Debounce
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: [
                'aria-label',
                'aria-labelledby',
                'role',
                'tabindex',
            ],
        });

        return () => observer.disconnect();
    }, [enabled]);

    return auditResult;
}

// Import React for the hook
import React from 'react';
