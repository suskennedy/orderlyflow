import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  quickOptionsButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
  },

  // ─── Category Card ───────────────────────────────────────────────
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  categoryCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  categoryCardSub: {
    fontSize: 12,
    marginTop: 1,
  },
  categoryCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
    minWidth: 26,
    alignItems: 'center',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── Expanded Section ────────────────────────────────────────────
  expandedSection: {
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // ─── Task Item (list row) ─────────────────────────────────────────
  taskItem: {
    marginBottom: 0,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 12,
  },
  taskHeader: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskInfo: {
    flex: 1,
    minWidth: 0,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  tagPillType: {
    backgroundColor: '#EEF2F4',
  },
  tagPillVendor: {
    backgroundColor: '#EAF3F7',
  },
  tagPillDate: {
    backgroundColor: '#FEF4E4',
  },
  tagPillActive: {
    backgroundColor: '#E6F4EA',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tagTextType: {
    color: '#6B7175',
  },
  tagTextVendor: {
    color: '#4A7A91',
  },
  tagTextDate: {
    color: '#9A7020',
  },
  tagTextActive: {
    color: '#3A7D50',
  },
  taskMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  taskMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskFrequency: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  editButton: {
    padding: 4,
  },

  // ─── Toggle Switch ────────────────────────────────────────────────
  toggleSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    padding: 3,
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  // ─── Task Detail Form ─────────────────────────────────────────────
  taskDetailsContainer: {
    overflow: 'hidden',
  },

  // Title card
  titleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  titleCardBody: {
    flex: 1,
    minWidth: 0,
  },
  titleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 20,
    marginBottom: 6,
  },
  titleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  titleName: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  titleDesc: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 8,
    marginTop: 4,
  },

  // Form body
  detailFormSection: {
    padding: 16,
  },

  // Vendor field card
  fieldCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  fieldIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldBody: {
    flex: 1,
    minWidth: 0,
  },
  fieldLbl: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldValEmpty: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Date + Time pills
  dtRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dtPill: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  dtPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dtPillValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dtPillText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  dtClearBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    flexShrink: 0,
  },
  dtPickerWrapper: {
    marginTop: 6,
  },

  // Recurring row
  recurringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recurringIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recurringText: {
    flex: 1,
  },
  recurringTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recurringSub: {
    fontSize: 12,
    marginTop: 1,
  },

  // Recurrence dropdown options (keep existing logic)
  recurrenceOptions: {
    marginTop: 6,
    marginBottom: 8,
  },
  recurrenceDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  recurrenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  recurrenceOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recurrencePatternBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  recurrencePatternBtnText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Notes card
  notesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 88,
    textAlignVertical: 'top',
    fontWeight: '400',
  },

  // Save button
  detailSaveButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  detailSaveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ─── Legacy / misc (kept for other uses) ─────────────────────────
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  taskDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  taskDetailValue: {
    fontSize: 14,
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  dropdownContainer: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownSection: {
    marginBottom: 12,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdownInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  dropdownButtonText: {
    flex: 1,
    fontSize: 16,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  frequencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    marginHorizontal: 2,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownTextArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  dropdownActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  quickOptionsList: {
    padding: 20,
  },
  quickOptionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  quickOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskCardsContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  taskDetailHeader: {
    marginBottom: 12,
  },
  taskDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDetailSubtitle: {
    fontSize: 16,
  },
  suggestedUseText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    fontStyle: 'italic',
    color: 'teal',
  },
  taskDetailToggle: {
    marginTop: 12,
    marginBottom: 12,
  },
  settingsGrid: {
    marginBottom: 16,
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingValueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1.5,
  },
  settingValueText: {
    fontSize: 15,
    flex: 1,
  },
  dateTimeGroup: {
    flex: 1.5,
    gap: 8,
  },
  recurrenceSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  recurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recurrenceDetailedOptions: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 16,
  },
  recurrenceDropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  recurrenceDropdownBtnText: {
    fontSize: 15,
  },
  recurrenceOptionsPopout: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  recurrenceOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  recurrenceOptionItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownArrow: {
    padding: 8,
    marginLeft: 8,
  },
  vendorList: {
    maxHeight: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  vendorItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 14,
  },
  emptyVendors: {
    padding: 20,
    alignItems: 'center',
  },
  emptyVendorsText: {
    fontSize: 16,
  },
  repairProjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  repairProjectInfo: {
    flex: 1,
    marginRight: 12,
  },
  repairProjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  repairProjectStatus: {
    fontSize: 14,
    marginBottom: 2,
  },
  repairProjectVendor: {
    fontSize: 14,
    marginBottom: 2,
  },
  repairProjectDue: {
    fontSize: 14,
    marginBottom: 2,
  },
  repairProjectBudget: {
    fontSize: 14,
    marginBottom: 2,
  },
  addRepairProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addRepairProjectText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addInlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 12,
  },
  detailDescriptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    minWidth: 0,
  },
  inputIcon: {
    marginRight: 14,
  },
  inputText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurrenceSettingContainer: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
