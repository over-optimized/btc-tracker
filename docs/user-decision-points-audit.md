# User Decision Points Audit

## Overview
Comprehensive audit of all modal windows and user decision points in the Bitcoin DCA Tracker app, identifying educational opportunities and areas for enhancement.

**Audit Date**: March 2025  
**Current App Status**: Pre-Alpha Development  
**Focus**: Transform decision points into educational opportunities

---

## 1. TransactionClassificationModal.tsx

### Current State
**Primary Decision**: Classify ambiguous transactions into one of 4 categories

**Options Available:**
- **Purchase** - Green button, no explanation
- **Self-Custody** - Blue button, minimal description ("Self-Custody Wallet")
- **Sale** - Red button, no explanation  
- **Skip** - Gray button, no explanation

**Additional Fields:**
- Destination wallet input for self-custody (optional)

### Educational Gaps
❌ **No tax implications explained**  
❌ **No examples of when to use each option**  
❌ **Missing common Lightning/P2P scenarios**  
❌ **No guidance on tax consequences**  
❌ **No "Learn More" expandable sections**

### Missing Classifications
- Gift received (taxable income)
- Gift sent (taxable disposal)
- Payment received (taxable income)
- Payment sent (taxable disposal)
- Reimbursement received (taxable)
- Mining/staking income (taxable)

### Enhancement Opportunities
✅ Add interactive tooltips for each button  
✅ Clear tax implication indicators (Taxable Income, Taxable Disposal, Non-Taxable)  
✅ Real-world scenario examples  
✅ US tax jurisdiction notice  
✅ "Why does this matter?" educational sections

---

## 2. TaxConfig.tsx

### Current State
**Primary Decision**: Select tax calculation method

**Options Available:**
- **FIFO** - Has description: "Uses oldest Bitcoin purchases first. Most common method." ✅
- **LIFO** - Has description: "Uses newest Bitcoin purchases first. May reduce gains in bull markets." ✅
- **HIFO** - Has description: "Uses highest cost Bitcoin first. Optimizes for tax loss harvesting." ✅
- **Specific ID** - Has description: "Manual selection of specific lots (Advanced feature)." ✅

**Additional Decisions:**
- Tax year selection (dropdown with years)
- Advanced settings toggle

### Educational Gaps
⚠️ **Limited real-world examples**  
⚠️ **No impact comparison between methods**  
⚠️ **No "which should I choose?" guidance**  
❌ **No US tax law context**

### Enhancement Opportunities
✅ Add scenario-based method recommendations  
✅ Include estimated impact indicators  
✅ "See example calculation" expandable sections  
✅ Professional disclaimer about tax method selection

---

## 3. AddWithdrawalModal.tsx

### Current State
**Primary Decision**: Record manual withdrawal details

**Required Fields:**
- Withdrawal date
- From exchange (dropdown)
- BTC amount
- Destination wallet name

**Optional Fields:**
- Network fee (BTC)
- Notes

### Educational Gaps  
❌ **No explanation that withdrawals are non-taxable**  
❌ **No guidance on self-custody best practices**  
❌ **No distinction between self-custody vs other transfers**  
❌ **No security milestone context**

### Enhancement Opportunities
✅ Clear "This is not a taxable event" notice  
✅ Self-custody milestone congratulations  
✅ Security best practices tips  
✅ Address validation guidance

---

## 4. ImportErrorModal.tsx

### Current State
**Primary Decision**: How to handle CSV import errors

**Options Structure:**
- **Errors tab** - Shows critical and recoverable errors
- **Warnings tab** - Shows non-blocking issues  
- **Solutions tab** - Recovery options with actions

**Recovery Actions:**
- Retry with different settings
- Export problematic data
- Skip invalid rows

### Educational Strengths ✅
✅ **Good progressive disclosure** (tabs, expandable sections)  
✅ **Context-aware recovery options**  
✅ **Clear error categorization**

### Enhancement Opportunities
✅ Add "Why did this happen?" explanations  
✅ Include "How to fix in CSV" guidance  
✅ Link to exchange export instructions  
✅ Educational content about CSV formats

---

## 5. TaxExport.tsx

### Current State
**Primary Decision**: Choose export format

**Available Options:**
- TurboTax CSV format
- Full JSON report
- Summary PDF (if implemented)

### Educational Gaps
❌ **No explanation of format differences**  
❌ **No guidance on which format to choose**  
❌ **No CPA/tax professional context**

### Enhancement Opportunities
✅ Format comparison table  
✅ "Best for [use case]" recommendations  
✅ Professional disclaimer about tax preparation

---

## 6. Data Validation & Startup Decisions

### Current State
**Implicit Decisions:** App handles data corruption silently or with generic errors

### Educational Gaps
❌ **No clear data reset options**  
❌ **No pre-alpha status explanation**  
❌ **No data backup guidance**

### Enhancement Opportunities  
✅ User-friendly data reset workflow  
✅ "Export before reset" options  
✅ Clear pre-alpha expectations  
✅ Migration guidance for schema changes

---

## Summary & Prioritization

### High Priority Educational Enhancements
1. **TransactionClassificationModal** - Biggest educational gap, most user confusion
2. **Tax implications throughout** - Critical for compliance
3. **US tax jurisdiction notices** - Legal clarity  
4. **Pre-alpha data handling** - User expectation management

### Medium Priority Enhancements
1. **TaxConfig guidance** - Already has good foundation
2. **Withdrawal modal education** - Self-custody best practices
3. **Import error education** - Already well-structured

### Educational Framework Needed
1. **Reusable tooltip component** - Consistent educational experience
2. **Tax implication indicators** - Visual system for tax consequences
3. **Scenario example component** - Real-world use cases
4. **US tax law context system** - Jurisdiction-specific guidance

### Success Metrics
- Reduced classification errors
- Increased user confidence
- Better tax compliance outcomes  
- Educational value perception

This audit forms the foundation for transforming the app into an educational Bitcoin tax compliance tool while maintaining its core tracking functionality.