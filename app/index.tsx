import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { supabase } from "../lib/supabase";

type Instrument = {
  id: number;
  name: string;
};

export default function App() {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    const { data, error } = await supabase.from("instruments").select();

    if (error) {
      setError(error.message);
      return;
    }

    setInstruments(data ?? []);
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error loading instruments: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={instruments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <Text style={styles.item}>{item.name}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
