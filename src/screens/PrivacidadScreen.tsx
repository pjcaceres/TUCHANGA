import { ScrollView, StyleSheet } from 'react-native';
import MarkdownContent from '../components/MarkdownContent';
import { colors } from '../constants/theme';
import { PRIVACIDAD_MD } from '../content/privacidad';

export default function PrivacidadScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MarkdownContent markdown={PRIVACIDAD_MD} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
});
