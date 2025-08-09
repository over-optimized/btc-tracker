# Outstanding Features & Development Plan

## 🎯 Overview

This document tracks remaining features and improvements for the Bitcoin DCA Tracker. Completed features are documented in [CHANGELOG.md](../CHANGELOG.md).

## ✅ Recently Completed

- **✅ Stable Transaction ID Generation** (v1.2.0) - Eliminates duplicate transactions on re-import
- **✅ Enhanced Error Handling** (v2.0.0) - Comprehensive error handling with recovery options

---

## 🎯 Next Priority: Tax Reporting System

### Overview
Implement comprehensive tax reporting with multiple calculation methods and export capabilities. This is the highest priority remaining feature based on user requests.

**Status**: Ready for implementation  
**Estimated Effort**: 6-8 weeks  
**Dependencies**: None (foundational work complete)

### Core Requirements

#### Tax Calculation Methods
- **FIFO (First In, First Out)**: Default method for most jurisdictions
- **LIFO (Last In, First Out)**: Alternative calculation method
- **HIFO (Highest In, First Out)**: Optimize for tax efficiency
- **Specific Identification**: Manual lot selection (advanced users)

#### Key Features Needed
1. **Lot Tracking System**: Track individual purchase lots with remaining balances
2. **Tax Event Engine**: Calculate capital gains/losses for disposals
3. **Multi-Year Reports**: Generate reports for specific tax years
4. **Export Formats**: CSV (tax software compatible), JSON (developers), PDF (professionals)
5. **Holding Period Logic**: Automatic short-term vs long-term classification
6. **Preview Mode**: Test calculations before finalizing reports

### Technical Architecture

```typescript
// Core Tax Types
interface TaxLot {
  id: string;
  purchaseDate: Date;
  btcAmount: number;
  costBasis: number;
  remaining: number;
  exchange: string;
}

interface TaxEvent {
  id: string;
  type: 'DISPOSAL' | 'ACQUISITION';
  date: Date;
  btcAmount: number;
  usdValue: number;
  capitalGain?: number;
  holdingPeriod?: 'SHORT' | 'LONG';
}
```

### Implementation Strategy

#### Phase 1: Core Engine (2 weeks)
- Tax calculation engine with FIFO/LIFO support
- Lot tracking and management system
- Basic tax event generation
- Comprehensive unit tests

#### Phase 2: User Interface (2 weeks)  
- Tax configuration component (method selection, year settings)
- Tax reports interface with summaries
- Preview functionality
- Integration with existing navigation

#### Phase 3: Export & Integration (1-2 weeks)
- Multi-format export utilities
- Integration with existing transaction data
- Error handling for tax scenarios
- Performance optimization for large datasets

#### Phase 4: Testing & Polish (1-2 weeks)
- End-to-end testing with real tax scenarios
- Cross-jurisdictional validation
- UI/UX refinements
- Documentation and user guides

### Success Metrics
- ✅ Accurate tax calculations validated against known scenarios
- ✅ Export files compatible with major tax software (TurboTax, TaxAct)
- ✅ Performance handles 10,000+ transactions efficiently
- ✅ User feedback validates ease of use
- ✅ Comprehensive test coverage (>90% for tax calculations)

### Future Considerations
- **Disposal Transaction Support**: Currently focuses on purchase-only portfolios
- **Multi-Currency Support**: International tax implications
- **Advanced Strategies**: Tax-loss harvesting optimization
- **Professional Integration**: CPA/tax professional collaboration features

---

## 📋 Development Process

### Task Tracking
Detailed task breakdown and progress tracking is maintained in [tasks.md](tasks.md).

### Quality Standards
- **Code Coverage**: >90% for critical tax calculations, >80% overall
- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Handling**: Comprehensive error scenarios with user-friendly messages
- **Performance**: Sub-second response for typical portfolio sizes
- **Accessibility**: WCAG 2.1 AA compliance for all new components

### Documentation Requirements
- **Technical**: Architecture decisions and API documentation
- **User**: Step-by-step tax reporting guides
- **Legal**: Clear disclaimers about tax advice limitations
- **Testing**: Comprehensive test scenarios and validation data

---

## 🔗 Related Resources

- [CHANGELOG.md](../CHANGELOG.md) - Completed features and releases
- [tasks.md](tasks.md) - Detailed task tracking and estimates  
- [CLAUDE.md](../CLAUDE.md) - Technical architecture and setup guide
