import { Injectable, OnApplicationBootstrap, Type } from '@nestjs/common'
import { PATH_METADATA } from '@nestjs/common/constants'
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core'
import { ACCESS_LEVEL_KEY, AccessLevel } from './access-level'
import { UNMANAGED_CONTROLLERS } from './access-whitelist'

type RouteHandler = (...args: unknown[]) => unknown

@Injectable()
export class AccessCoverageValidator implements OnApplicationBootstrap {
	constructor(
		private readonly discovery: DiscoveryService,
		private readonly scanner: MetadataScanner,
		private readonly reflector: Reflector,
	) {}

	onApplicationBootstrap(): void {
		const uncovered = this.findUncoveredRoutes()

		if (uncovered.length > 0) {
			throw new Error(
				`Routes are missing an access level (@PublicAccess/@UserAccess/@AdminAccess): ${uncovered.join(', ')}`,
			)
		}
	}

	private findUncoveredRoutes(): string[] {
		const uncovered: string[] = []

		for (const wrapper of this.discovery.getControllers()) {
			const controller: unknown = wrapper.metatype

			if (
				!this.isClass(controller) ||
				UNMANAGED_CONTROLLERS.includes(controller.name)
			) {
				continue
			}

			uncovered.push(...this.uncoveredHandlers(controller))
		}

		return uncovered
	}

	private uncoveredHandlers(controller: Type): string[] {
		const prototype: object = controller.prototype
		const uncovered: string[] = []

		for (const methodName of this.scanner.getAllMethodNames(prototype)) {
			const handler = this.getHandler(prototype, methodName)

			if (!handler || !Reflect.hasMetadata(PATH_METADATA, handler)) {
				continue
			}

			const level = this.reflector.getAllAndOverride<
				AccessLevel | undefined
			>(ACCESS_LEVEL_KEY, [handler, controller])

			if (!level) {
				uncovered.push(`${controller.name}.${methodName}`)
			}
		}

		return uncovered
	}

	private getHandler(
		prototype: object,
		methodName: string,
	): RouteHandler | undefined {
		const descriptor = Object.getOwnPropertyDescriptor(
			prototype,
			methodName,
		)
		const value: unknown = descriptor?.value

		return this.isRouteHandler(value) ? value : undefined
	}

	private isRouteHandler(value: unknown): value is RouteHandler {
		return typeof value === 'function'
	}

	private isClass(metatype: unknown): metatype is Type {
		return typeof metatype === 'function' && 'prototype' in metatype
	}
}
