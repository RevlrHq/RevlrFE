/**
 * SignalR Bundle Size Analyzer
 *
 * This utility analyzes and optimizes the bundle size of SignalR-related
 * components and provides recommendations for reducing bundle size.
 *
 * Features:
 * - Bundle size analysis
 * - Tree-shaking optimization detection
 * - Lazy loading recommendations
 * - Code splitting analysis
 * - Performance impact assessment
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface BundleAnalysisResult {
    totalSize: number;
    gzippedSize: number;
    components: ComponentAnalysis[];
    recommendations: BundleRecommendation[];
    optimizationOpportunities: OptimizationOpportunity[];
    performanceImpact: PerformanceImpact;
}

interface ComponentAnalysis {
    name: string;
    path: string;
    size: number;
    gzippedSize: number;
    dependencies: string[];
    isLazyLoaded: boolean;
    isTreeShakeable: boolean;
    usageFrequency: 'high' | 'medium' | 'low';
    criticalPath: boolean;
}

interface BundleRecommendation {
    type:
        | 'lazy-loading'
        | 'code-splitting'
        | 'tree-shaking'
        | 'dependency-optimization';
    component: string;
    description: string;
    estimatedSavings: number;
    priority: 'high' | 'medium' | 'low';
    implementation: string;
}

interface OptimizationOpportunity {
    category: 'bundle-size' | 'loading-performance' | 'runtime-performance';
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    estimatedImprovement: string;
}

interface PerformanceImpact {
    loadingTime: {
        estimated: number;
        withOptimizations: number;
        improvement: number;
    };
    memoryUsage: {
        estimated: number;
        withOptimizations: number;
        improvement: number;
    };
    runtimePerformance: {
        score: number;
        bottlenecks: string[];
        optimizations: string[];
    };
}

// ============================================================================
// Bundle Analyzer Implementation
// ============================================================================

export class SignalRBundleAnalyzer {
    private projectRoot: string;
    private signalrComponents: string[] = [
        'src/hooks/useSignalR.ts',
        'src/hooks/useTypedNotificationHandler.ts',
        'src/hooks/useNotificationGroups.ts',
        'src/hooks/useNotificationBatching.ts',
        'src/hooks/useConnectionOptimization.ts',
        'src/providers/SignalRProvider.tsx',
        'src/components/notifications/',
        'src/lib/services/SignalRAuthService.ts',
        'src/lib/services/SignalRStateService.ts',
        'src/lib/services/NavigationService.ts',
        'src/types/signalr.ts',
        'src/types/notifications.ts',
    ];

    constructor(projectRoot: string = process.cwd()) {
        this.projectRoot = projectRoot;
    }

    async analyzeBundleSize(): Promise<BundleAnalysisResult> {
        console.log('🔍 Analyzing SignalR bundle size...');

        const components = await this.analyzeComponents();
        const totalSize = components.reduce((sum, comp) => sum + comp.size, 0);
        const totalGzippedSize = components.reduce(
            (sum, comp) => sum + comp.gzippedSize,
            0
        );

        const recommendations = this.generateRecommendations(components);
        const optimizationOpportunities =
            this.identifyOptimizationOpportunities(components);
        const performanceImpact = this.assessPerformanceImpact(components);

        return {
            totalSize,
            gzippedSize: totalGzippedSize,
            components,
            recommendations,
            optimizationOpportunities,
            performanceImpact,
        };
    }

    private async analyzeComponents(): Promise<ComponentAnalysis[]> {
        const analyses: ComponentAnalysis[] = [];

        for (const componentPath of this.signalrComponents) {
            const fullPath = join(this.projectRoot, componentPath);

            if (componentPath.endsWith('/')) {
                // Directory - analyze all files in it
                const dirAnalyses = await this.analyzeDirectory(
                    fullPath,
                    componentPath
                );
                analyses.push(...dirAnalyses);
            } else if (existsSync(fullPath)) {
                // Single file
                const analysis = await this.analyzeFile(
                    fullPath,
                    componentPath
                );
                if (analysis) {
                    analyses.push(analysis);
                }
            }
        }

        return analyses;
    }

    private async analyzeDirectory(
        dirPath: string,
        relativePath: string
    ): Promise<ComponentAnalysis[]> {
        const analyses: ComponentAnalysis[] = [];

        if (!existsSync(dirPath)) {
            return analyses;
        }

        try {
            const fs = await import('fs');
            const files = fs.readdirSync(dirPath);

            for (const file of files) {
                if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                    const filePath = join(dirPath, file);
                    const relativeFilePath = join(relativePath, file);
                    const analysis = await this.analyzeFile(
                        filePath,
                        relativeFilePath
                    );
                    if (analysis) {
                        analyses.push(analysis);
                    }
                }
            }
        } catch (error) {
            console.warn(
                `Warning: Could not analyze directory ${dirPath}:`,
                error
            );
        }

        return analyses;
    }

    private async analyzeFile(
        filePath: string,
        relativePath: string
    ): Promise<ComponentAnalysis | null> {
        try {
            const content = readFileSync(filePath, 'utf8');
            const stats = statSync(filePath);
            const size = stats.size;
            const gzippedSize = gzipSync(content).length;

            const dependencies = this.extractDependencies(content);
            const isLazyLoaded = this.isLazyLoaded(content);
            const isTreeShakeable = this.isTreeShakeable(content);
            const usageFrequency = this.determineUsageFrequency(relativePath);
            const criticalPath = this.isCriticalPath(relativePath);

            return {
                name: relativePath.split('/').pop() || relativePath,
                path: relativePath,
                size,
                gzippedSize,
                dependencies,
                isLazyLoaded,
                isTreeShakeable,
                usageFrequency,
                criticalPath,
            };
        } catch (error) {
            console.warn(`Warning: Could not analyze file ${filePath}:`, error);
            return null;
        }
    }

    private extractDependencies(content: string): string[] {
        const dependencies: string[] = [];

        // Extract import statements
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(content)) !== null) {
            dependencies.push(match[1]);
        }

        // Extract dynamic imports
        const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
        while ((match = dynamicImportRegex.exec(content)) !== null) {
            dependencies.push(match[1]);
        }

        return dependencies;
    }

    private isLazyLoaded(content: string): boolean {
        // Check for lazy loading patterns
        return (
            content.includes('React.lazy') ||
            content.includes('dynamic(') ||
            content.includes('import(')
        );
    }

    private isTreeShakeable(content: string): boolean {
        // Check for tree-shaking friendly patterns
        const hasNamedExports =
            /export\s+(const|function|class|interface|type)/.test(content);
        /export\s+default/.test(content);
        const hasSideEffects =
            content.includes('window.') ||
            content.includes('document.') ||
            content.includes('console.') ||
            /import\s+['"][^'"]*\.css['"]/.test(content);

        return hasNamedExports && !hasSideEffects;
    }

    private determineUsageFrequency(path: string): 'high' | 'medium' | 'low' {
        // Determine usage frequency based on component type and location
        if (path.includes('Provider') || path.includes('useSignalR.ts')) {
            return 'high'; // Core components used everywhere
        }
        if (path.includes('hooks/') || path.includes('services/')) {
            return 'medium'; // Utility components used in multiple places
        }
        return 'low'; // Specific components used in few places
    }

    private isCriticalPath(path: string): boolean {
        // Determine if component is on critical rendering path
        const criticalComponents = [
            'SignalRProvider',
            'useSignalR',
            'useTypedNotificationHandler',
        ];

        return criticalComponents.some((comp) => path.includes(comp));
    }

    private generateRecommendations(
        components: ComponentAnalysis[]
    ): BundleRecommendation[] {
        const recommendations: BundleRecommendation[] = [];

        for (const component of components) {
            // Lazy loading recommendations
            if (
                !component.isLazyLoaded &&
                component.usageFrequency === 'low' &&
                component.size > 5000
            ) {
                recommendations.push({
                    type: 'lazy-loading',
                    component: component.name,
                    description: `Implement lazy loading for ${component.name} to reduce initial bundle size`,
                    estimatedSavings: component.size,
                    priority: 'high',
                    implementation: `Use React.lazy() or Next.js dynamic() to load ${component.name} on demand`,
                });
            }

            // Code splitting recommendations
            if (component.size > 10000 && !component.criticalPath) {
                recommendations.push({
                    type: 'code-splitting',
                    component: component.name,
                    description: `Split ${component.name} into a separate chunk`,
                    estimatedSavings: Math.floor(component.size * 0.7),
                    priority: 'medium',
                    implementation: `Move ${component.name} to a separate bundle using dynamic imports`,
                });
            }

            // Tree shaking recommendations
            if (!component.isTreeShakeable && component.size > 3000) {
                recommendations.push({
                    type: 'tree-shaking',
                    component: component.name,
                    description: `Optimize ${component.name} for better tree shaking`,
                    estimatedSavings: Math.floor(component.size * 0.3),
                    priority: 'medium',
                    implementation: `Use named exports and avoid side effects in ${component.name}`,
                });
            }

            // Dependency optimization
            const heavyDependencies = component.dependencies.filter(
                (dep) =>
                    dep.includes('@microsoft/signalr') ||
                    dep.includes('lodash') ||
                    dep.includes('moment')
            );

            if (heavyDependencies.length > 0) {
                recommendations.push({
                    type: 'dependency-optimization',
                    component: component.name,
                    description: `Optimize heavy dependencies in ${component.name}`,
                    estimatedSavings: 15000, // Estimated savings from dependency optimization
                    priority: 'high',
                    implementation: `Use specific imports instead of full library imports`,
                });
            }
        }

        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    private identifyOptimizationOpportunities(
        components: ComponentAnalysis[]
    ): OptimizationOpportunity[] {
        const opportunities: OptimizationOpportunity[] = [];

        const totalSize = components.reduce((sum, comp) => sum + comp.size, 0);
        const lazyLoadableSize = components
            .filter(
                (comp) => !comp.isLazyLoaded && comp.usageFrequency !== 'high'
            )
            .reduce((sum, comp) => sum + comp.size, 0);

        if (lazyLoadableSize > totalSize * 0.3) {
            opportunities.push({
                category: 'loading-performance',
                description:
                    'Significant portion of SignalR code can be lazy loaded',
                impact: 'high',
                effort: 'medium',
                estimatedImprovement: `Reduce initial bundle by ${Math.floor(lazyLoadableSize / 1024)}KB`,
            });
        }

        const nonTreeShakeableSize = components
            .filter((comp) => !comp.isTreeShakeable)
            .reduce((sum, comp) => sum + comp.size, 0);

        if (nonTreeShakeableSize > totalSize * 0.2) {
            opportunities.push({
                category: 'bundle-size',
                description:
                    'Improve tree shaking for better dead code elimination',
                impact: 'medium',
                effort: 'low',
                estimatedImprovement: `Reduce bundle by ${Math.floor((nonTreeShakeableSize * 0.3) / 1024)}KB`,
            });
        }

        const criticalPathSize = components
            .filter((comp) => comp.criticalPath)
            .reduce((sum, comp) => sum + comp.size, 0);

        if (criticalPathSize > 50000) {
            opportunities.push({
                category: 'runtime-performance',
                description:
                    'Critical path components are large and may impact initial render',
                impact: 'high',
                effort: 'high',
                estimatedImprovement:
                    'Improve Time to Interactive by 200-500ms',
            });
        }

        return opportunities;
    }

    private assessPerformanceImpact(
        components: ComponentAnalysis[]
    ): PerformanceImpact {
        const totalSize = components.reduce((sum, comp) => sum + comp.size, 0);
        const gzippedSize = components.reduce(
            (sum, comp) => sum + comp.gzippedSize,
            0
        );

        // Estimate loading time (rough calculation based on average connection speeds)
        const estimatedLoadingTime = gzippedSize / (1024 * 100); // Assuming 100KB/s average
        const optimizedSize = gzippedSize * 0.7; // Assume 30% reduction with optimizations
        const optimizedLoadingTime = optimizedSize / (1024 * 100);

        // Estimate memory usage
        const estimatedMemoryUsage = totalSize * 2; // Rough estimate including runtime overhead
        const optimizedMemoryUsage = estimatedMemoryUsage * 0.8; // 20% reduction

        // Runtime performance assessment
        const criticalComponents = components.filter(
            (comp) => comp.criticalPath
        );
        const bottlenecks: string[] = [];
        const optimizations: string[] = [];

        if (criticalComponents.length > 3) {
            bottlenecks.push('Too many components on critical rendering path');
            optimizations.push(
                'Implement code splitting for non-essential components'
            );
        }

        if (totalSize > 100000) {
            bottlenecks.push('Large bundle size impacts initial load');
            optimizations.push('Implement lazy loading and tree shaking');
        }

        const performanceScore = Math.max(
            0,
            100 - totalSize / 1000 - criticalComponents.length * 5
        );

        return {
            loadingTime: {
                estimated: estimatedLoadingTime,
                withOptimizations: optimizedLoadingTime,
                improvement: estimatedLoadingTime - optimizedLoadingTime,
            },
            memoryUsage: {
                estimated: estimatedMemoryUsage,
                withOptimizations: optimizedMemoryUsage,
                improvement: estimatedMemoryUsage - optimizedMemoryUsage,
            },
            runtimePerformance: {
                score: performanceScore,
                bottlenecks,
                optimizations,
            },
        };
    }

    generateReport(analysis: BundleAnalysisResult): string {
        const report = [
            '# SignalR Bundle Analysis Report',
            `Generated: ${new Date().toISOString()}`,
            '',
            '## Summary',
            `- Total Size: ${Math.floor(analysis.totalSize / 1024)}KB`,
            `- Gzipped Size: ${Math.floor(analysis.gzippedSize / 1024)}KB`,
            `- Components Analyzed: ${analysis.components.length}`,
            `- Optimization Opportunities: ${analysis.optimizationOpportunities.length}`,
            '',
            '## Performance Impact',
            `- Estimated Loading Time: ${analysis.performanceImpact.loadingTime.estimated.toFixed(2)}s`,
            `- With Optimizations: ${analysis.performanceImpact.loadingTime.withOptimizations.toFixed(2)}s`,
            `- Potential Improvement: ${analysis.performanceImpact.loadingTime.improvement.toFixed(2)}s`,
            `- Runtime Performance Score: ${analysis.performanceImpact.runtimePerformance.score.toFixed(1)}/100`,
            '',
            '## Top Recommendations',
            ...analysis.recommendations
                .slice(0, 5)
                .map(
                    (rec) =>
                        `- **${rec.type}**: ${rec.description} (${Math.floor(rec.estimatedSavings / 1024)}KB savings)`
                ),
            '',
            '## Component Analysis',
            '| Component | Size | Gzipped | Lazy Loaded | Tree Shakeable | Usage |',
            '|-----------|------|---------|-------------|----------------|-------|',
            ...analysis.components
                .sort((a, b) => b.size - a.size)
                .slice(0, 10)
                .map(
                    (comp) =>
                        `| ${comp.name} | ${Math.floor(comp.size / 1024)}KB | ${Math.floor(comp.gzippedSize / 1024)}KB | ${comp.isLazyLoaded ? '✅' : '❌'} | ${comp.isTreeShakeable ? '✅' : '❌'} | ${comp.usageFrequency} |`
                ),
            '',
            '## Optimization Opportunities',
            ...analysis.optimizationOpportunities.map(
                (opp) =>
                    `- **${opp.category}** (${opp.impact} impact, ${opp.effort} effort): ${opp.description} - ${opp.estimatedImprovement}`
            ),
            '',
            '## Implementation Guide',
            ...analysis.recommendations
                .slice(0, 3)
                .map((rec) => [
                    `### ${rec.component} - ${rec.type}`,
                    rec.implementation,
                    '',
                ])
                .flat(),
        ];

        return report.join('\n');
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

export async function analyzeBundleSize(
    projectRoot?: string
): Promise<BundleAnalysisResult> {
    const analyzer = new SignalRBundleAnalyzer(projectRoot);
    return await analyzer.analyzeBundleSize();
}

export async function generateBundleReport(
    projectRoot?: string
): Promise<string> {
    const analyzer = new SignalRBundleAnalyzer(projectRoot);
    const analysis = await analyzer.analyzeBundleSize();
    return analyzer.generateReport(analysis);
}

// CLI usage
if (require.main === module) {
    (async () => {
        try {
            console.log('🔍 Analyzing SignalR bundle size...');
            const analysis = await analyzeBundleSize();
            const report = new SignalRBundleAnalyzer().generateReport(analysis);

            console.log(report);

            // Save report to file
            const fs = await import('fs');
            const path = await import('path');
            const reportsDir = path.join(
                process.cwd(),
                'coverage',
                'bundle-analysis'
            );

            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            const reportPath = path.join(
                reportsDir,
                `signalr-bundle-analysis-${Date.now()}.md`
            );
            fs.writeFileSync(reportPath, report);

            console.log(`\n📄 Report saved to: ${reportPath}`);
        } catch (error) {
            console.debug('❌ Bundle analysis failed:', error);
            process.exit(1);
        }
    })();
}
