import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { fetchAiHealth, fetchHello } from '../src/api';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; text: string }
  | { kind: 'err'; text: string };

export default function Debug() {
  const [api, setApi] = useState<Status>({ kind: 'idle' });
  const [ai, setAi] = useState<Status>({ kind: 'idle' });

  const callApi = async () => {
    setApi({ kind: 'loading' });
    try {
      const res = await fetchHello();
      setApi({ kind: 'ok', text: res.message });
    } catch (e) {
      setApi({ kind: 'err', text: e instanceof Error ? e.message : 'unknown error' });
    }
  };

  const callAi = async () => {
    setAi({ kind: 'loading' });
    try {
      const res = await fetchAiHealth();
      setAi({ kind: 'ok', text: `ok=${res.ok}` });
    } catch (e) {
      setAi({ kind: 'err', text: e instanceof Error ? e.message : 'unknown error' });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend smoke test</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>API service · GET /hello</Text>
        <Button
          title={api.kind === 'loading' ? 'Loading…' : 'Say hello'}
          onPress={callApi}
          disabled={api.kind === 'loading'}
        />
        <StatusLine status={api} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI service · GET /health</Text>
        <Button
          title={ai.kind === 'loading' ? 'Loading…' : 'Check AI health'}
          onPress={callAi}
          disabled={ai.kind === 'loading'}
        />
        <StatusLine status={ai} />
      </View>
    </View>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === 'ok') return <Text style={styles.ok}>{status.text}</Text>;
  if (status.kind === 'err') return <Text style={styles.err}>{status.text}</Text>;
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600' },
  card: { gap: 8, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  ok: { fontSize: 15, color: '#1a7f37' },
  err: { fontSize: 13, color: '#cf222e' },
});
