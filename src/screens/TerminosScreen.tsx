import { ScrollView, StyleSheet } from 'react-native';
import MarkdownContent from '../components/MarkdownContent';
import { colors } from '../constants/theme';
import { TERMINOS_MD } from '../content/terminos';

export default function TerminosScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MarkdownContent markdown={TERMINOS_MD} />
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
