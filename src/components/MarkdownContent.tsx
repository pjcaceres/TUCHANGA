import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import {
  dividirEnNegrita,
  esParrafoItalico,
  parseMarkdown,
  quitarItalica,
} from '../lib/markdown';

interface Props {
  markdown: string;
}

export default function MarkdownContent({ markdown }: Props) {
  const bloques = parseMarkdown(markdown);

  return (
    <View style={styles.container}>
      {bloques.map((bloque, index) => {
        if (bloque.type === 'heading') {
          const estilo =
            bloque.level === 1 ? styles.h1 : bloque.level === 2 ? styles.h2 : styles.h3;
          return (
            <Text key={index} style={estilo}>
              {bloque.text}
            </Text>
          );
        }

        if (bloque.type === 'list') {
          return (
            <View key={index} style={styles.list}>
              {bloque.items.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listText}>{renderInline(item)}</Text>
                </View>
              ))}
            </View>
          );
        }

        if (esParrafoItalico(bloque.text)) {
          return (
            <Text key={index} style={styles.italico}>
              {quitarItalica(bloque.text)}
            </Text>
          );
        }

        return (
          <Text key={index} style={styles.paragraph}>
            {renderInline(bloque.text)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInline(texto: string) {
  return dividirEnNegrita(texto).map((parte, i) =>
    parte.negrita ? (
      <Text key={i} style={styles.negrita}>
        {parte.texto}
      </Text>
    ) : (
      <Text key={i}>{parte.texto}</Text>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  h1: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  h2: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  h3: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 6,
  },
  paragraph: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
  },
  italico: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textMuted,
    lineHeight: 19,
  },
  negrita: {
    fontWeight: '700',
  },
  list: {
    gap: 6,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
  },
  listBullet: {
    fontSize: 14,
    color: colors.textMuted,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
  },
});
