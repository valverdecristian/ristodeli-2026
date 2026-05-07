import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const globalStyles = StyleSheet.create({
  // Contenedores principales
  container: {
    flex: 1,
    backgroundColor: colors.background, // retro-green
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cards
  ristoCard: {
    backgroundColor: colors.cardBackground, // russet
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    // Sombra
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  
  // Cards destacadas
  ristoCardHighlight: {
    backgroundColor: colors.cardHighlight, // saffron
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // Tipografía
  textCream: { color: colors.vanillaCream },
  textSaffron: { color: colors.saffron },
  textRed: { color: colors.fireRed },
  textGreen: { color: colors.retroGreen },
  textRusset: { color: colors.russet },
  textVanilla: { color: colors.vanillaCream },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary, // vanilla-cream
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 20,
    opacity: 0.9,
  },
  text: {
    fontSize: 16,
    color: colors.textPrimary,
  },

  // Fondos útiles
  bgRusset: { backgroundColor: colors.russet },
  bgCream: { backgroundColor: colors.vanillaCream },
  bgGreen: { backgroundColor: colors.retroGreen },

  // Botones generales
  buttonPrimary: {
    backgroundColor: colors.tertiary, // saffron (para contrastar en fondo verde)
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    marginTop: 15,
  },
  buttonTextPrimary: {
    color: colors.textDark, // russet
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Inputs y Formularios
  input: {
    backgroundColor: colors.cardBackground, // russet
    borderWidth: 1,
    borderColor: colors.tertiary, // saffron
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 15,
  },

  // Utilidades de márgenes
  mb1: { marginBottom: 10 },
  mb2: { marginBottom: 20 },
  mb3: { marginBottom: 30 },
  mt1: { marginTop: 10 },
  mt2: { marginTop: 20 },
  mt3: { marginTop: 30 },
});
