import { expect, it } from 'vitest'
import { ESLint } from 'eslint'

it('keeps React hooks unconditional when opening and closing the opportunity wizard', async () => {
  const eslint = new ESLint({ overrideConfig: [{
    rules: { 'react-hooks/rules-of-hooks': 'error' },
  }] })
  const results = await eslint.lintFiles(['src/components/dashboards/business/tabs/CreateOpportunityWizardModal.tsx'])
  expect(results.flatMap(result => result.messages).filter(message => message.fatal || message.ruleId === 'react-hooks/rules-of-hooks')).toEqual([])
}, 60000)
