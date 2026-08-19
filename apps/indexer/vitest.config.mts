import { defineConfig } from 'vitest/config'
import { projectFactory } from '../../vitest.shared.mts'

const projectFor = projectFactory(import.meta.dirname)

export default defineConfig({
	test: {
		projects: [projectFor('e2e')],
	},
})
