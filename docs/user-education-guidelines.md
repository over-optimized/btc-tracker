# User Education Guidelines

## Mandatory UX Review for All Features

When adding/modifying any user-facing feature, ALWAYS consider:

1. **Decision Clarity**: Can users understand what each option means?
2. **Tax Implications**: Are tax consequences clearly explained?
3. **Educational Opportunities**: Can we teach users about Bitcoin/tax concepts?
4. **Error Prevention**: What mistakes might users make here?
5. **US Tax Focus**: Is US jurisdiction clearly indicated?

## Pre-Alpha Data Handling

- Breaking changes to data schemas are acceptable
- Always provide export options before data resets
- Clear messaging about pre-alpha data reliability expectations
- Build towards future backwards compatibility

## Educational Component Requirements

- All modals with user decisions MUST include educational tooltips
- Tax-related features MUST include tax implication warnings
- Complex features MUST include "Learn More" sections
- All financial calculations MUST include educational context

## Testing Requirements for Educational Features

- Test scenarios must include "confused user" workflows
- Educational content must be verified by tax research
- Tooltips and help sections require comprehensive content testing
- UI components must work with educational framework integration

## Lightning Network & P2P Transaction Standards

- All transaction types must be covered: gifts, payments, reimbursements, mining/staking
- Tax implications must be clearly explained for each scenario
- Real-world examples must be provided for user guidance
- Common mistakes must be addressed with warnings

## US Tax Compliance Focus

- All tax calculations assume US tax law compliance
- Clear jurisdiction notices must be included
- International users must receive appropriate guidance
- Professional disclaimers required for tax-related features

## Educational Component System

The app includes a comprehensive educational framework in `src/components/educational/`:

- **InfoTooltip**: Hover/click explanations with tax implications
- **TaxImplicationIndicator**: Visual indicators for taxable income, disposal, non-taxable events
- **TaxEducationPanel**: Expandable educational content with examples and warnings
- **ScenarioExample**: Real-world use case demonstrations with tax calculations
- **USJurisdictionNotice**: Clear US tax law focus messaging

## Data Validation & Migration System

Pre-alpha status allows breaking changes with user-friendly workflows:

- **Startup Validation**: Automatic data compatibility checking on app launch
- **Export-Before-Reset**: User can backup data before schema changes
- **Migration Support**: Automatic data migration when possible
- **Clear Communication**: Pre-alpha status and data reset expectations clearly communicated
- **Recovery Options**: Multiple pathways for users to handle data incompatibility

## Content Guidelines

### Educational Content Standards

1. **Accuracy**: All tax information must be researched and current
2. **Clarity**: Use simple language, avoid jargon
3. **Examples**: Provide real-world scenarios users can relate to
4. **Disclaimers**: Always include appropriate legal disclaimers
5. **US Focus**: Clearly indicate US tax law scope

### Warning Message Standards

```jsx
// Example warning message format
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
  <div className="flex">
    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
    <div className="ml-3">
      <h3 className="text-sm font-medium text-yellow-800">Tax Implication Notice</h3>
      <p className="mt-2 text-sm text-yellow-700">
        This action may create a taxable event. Consult a tax professional.
      </p>
    </div>
  </div>
</div>
```

### Tooltip Content Guidelines

- Keep explanations under 2-3 sentences
- Focus on practical implications
- Include links to authoritative sources when appropriate
- Use consistent terminology throughout the app

## User Journey Considerations

### First-Time Users

- Progressive disclosure of complex features
- Clear onboarding with educational context
- Examples with sample data
- Tooltips on all complex UI elements

### Advanced Users

- Quick access to detailed information
- Batch operations with safeguards
- Advanced configuration with clear implications
- Export capabilities for external analysis

### Error Scenarios

- Clear error messages with recovery steps
- Educational context about why errors occur
- Multiple recovery pathways
- Help documentation links
