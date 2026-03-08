import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  taskItem: {
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
  },
  taskInfo: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.3,
    minWidth: 0,
  },
  taskSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButton: {
    padding: 4,
  },
  dropdownContainer: {
    padding: 16,
    paddingTop: 0,
    marginTop: -8,
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 16,
    opacity: 0.1,
  },
  detailSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
  },
  notesContainer: {
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
