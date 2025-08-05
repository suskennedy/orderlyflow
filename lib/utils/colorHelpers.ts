
/**
 * Helper function to get hex color codes for calendar events
 */
export const getColorHex = (color: string): string => {
  switch (color) {
    case 'red': return '#DC2626';
    case 'blue': return '#4F46E5';
    case 'green': return '#10B981';
    case 'yellow': return '#F59E0B';
    case 'purple': return '#8B5CF6';
    case 'pink': return '#DB2777';
    default: return '#6B7280';
  }
};

/**
 * Get the corresponding lighter color for the highlighted date
 */
export const getEventColor = (colorName: string): string => {
  switch (colorName) {
    case 'red': return '#FECACA'; // Lighter red
    case 'blue': return '#DBEAFE'; // Lighter blue
    case 'green': return '#D1FAE5'; // Lighter green
    case 'yellow': return '#FEF3C7'; // Lighter yellow
    case 'purple': return '#EDE9FE'; // Lighter purple
    case 'pink': return '#FCE7F3'; // Lighter pink
    default: return '#F3F4F6'; // Light gray
  }
};

/**
 * Get calendar theme configuration with theme support
 */
export const getCalendarTheme = (colors:any ) => ({
  backgroundColor: colors.surface,
  calendarBackground: colors.surface,
  textSectionTitleColor: colors.textTertiary,
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: colors.textInverse,
  todayTextColor: colors.primary,
  dayTextColor: colors.text,
  textDisabledColor: colors.textTertiary,
  dotColor: colors.primary,
  selectedDotColor: colors.textInverse,
  arrowColor: colors.primary,
  monthTextColor: colors.text,
  textMonthFontWeight: '600',
  textMonthFontSize: 16,
  textDayFontSize: 14,
  textDayHeaderFontSize: 12,
  'stylesheet.day.basic': {
    base: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    today: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 20,
    },
  },
  'stylesheet.calendar.header': {
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    monthText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  },
});

/**
 * Get dark theme calendar colors
 */
export const getDarkCalendarTheme = (colors: any) => ({
  backgroundColor: colors.surface,
  calendarBackground: colors.surface,
  textSectionTitleColor: colors.textTertiary,
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: colors.textInverse,
  todayTextColor: colors.primary,
  dayTextColor: colors.text,
  textDisabledColor: colors.textTertiary,
  dotColor: colors.primary,
  selectedDotColor: colors.textInverse,
  arrowColor: colors.primary,
  monthTextColor: colors.text,
  textMonthFontWeight: '600',
  textMonthFontSize: 16,
  textDayFontSize: 14,
  textDayHeaderFontSize: 12,
  'stylesheet.day.basic': {
    base: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    today: {
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 20,
    },
  },
  'stylesheet.calendar.header': {
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    monthText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  },
});