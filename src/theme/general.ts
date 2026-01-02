import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingBottom: 24,
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 20,
    height: 120
  },
  headerGreeting: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 1,
    fontSize: 14,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 10
  },
  notifButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowCenter: { 
    flexDirection: 'row',
    alignItems: 'center' 
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -50,
  },
  cardShortcuts: {
    marginBottom: 16,
    padding: 20
  },
  cardTips: {
    padding: 20,
    backgroundColor: '#ffe3edff',
    marginBottom: 15
  },
  shortcutsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shortcutButton: {
    alignItems: 'center',
    gap: 6,
    width: '22%',
  },
  shortcutIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortcutLabel: {
    fontSize: 11,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  feelButton: {
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
    width: '20%',
  },
  feelText: {
    fontSize: 20
  },
  notificationsWrapper: {
    gap: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  notificationText: {
    color: '#1A1A1A',
    flex: 1,
    fontSize: 14,
  },
  quickActionWrapper: {
    marginTop: 24,
    marginBottom: 25
  },
  quickActionButton: {
    backgroundColor: '#0073FF', // pengganti gradient-primary
    padding: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    width: '100%',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  quickActionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
  },
  textGroup: {
    marginLeft: 10,
    flexDirection: 'column',
  },
  headerSetting: {
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    height: 300
  },
  wrapper: {
    alignItems: 'center',
  },
  avatar: {
    width: 75,
    height: 75,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  member: {
    color: '#ffffff',
    fontWeight: '300',
    fontSize: 12
  },
  fontSmall: {
    fontSize: 12
  },
  buttonText: {
    color: '#000000ff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});