import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ExplorePlacesScreen() {
    const navigation = useNavigation<any>();
    const [avatar, setAvatar] = useState('https://i.pravatar.cc/100?img=11');
    
    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
            if (docSnap.exists() && docSnap.data().avatar) {
                setAvatar(docSnap.data().avatar);
            }
        });
        return () => unsub();
    }, []);

    return (
        <View style={styles.container}>
            {/* Map Background */}
            <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                latitude: 35.6762,
                longitude: 139.6503,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
                }}
            >
                {/* Floating Restaurant Marker */}
                <Marker coordinate={{ latitude: 35.6762, longitude: 139.6503 }}>
                    <View style={styles.markerContainer}>
                        <Ionicons name="restaurant" size={16} color="#114C5A" />
                    </View>
                </Marker>
            </MapView>

            {/* Top Navigation */}
            <View style={styles.topContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="menu" size={28} color="#114C5A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>The Digital Concierge</Text>
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                    </View>
                </View>

                {/* Floating Search */}
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="#114C5A" />
                    <TextInput
                        placeholder="Search hidden gems in..."
                        style={styles.searchInput}
                        placeholderTextColor="#666"
                    />
                    <Ionicons name="options" size={20} color="#114C5A" />
                </View>
            </View>

            {/* Float Buttons */}
            <View style={styles.mapActions}>
                <TouchableOpacity style={styles.mapBtn}>
                    <Ionicons name="add" size={24} color="#114C5A" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapBtn}>
                    <Ionicons name="remove" size={24} color="#114C5A" />
                </TouchableOpacity>
            </View>

            {/* Bottom Floating Card */}
            <TouchableOpacity onPress={() => navigation.navigate('Itinerary')} style={styles.cardContainer}>
                <View style={styles.cardInner}>
                    <Image 
                        source={{ uri: 'https://images.unsplash.com/photo-1493904443152-192ac7c6dfb4?q=80&w=600&auto=format&fit=crop' }} 
                        style={styles.cardImage} 
                    />
                    <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>FEATURED</Text>
                    </View>
                    
                    <View style={{padding: 20}}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Kyoto Garden</Text>
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color="#8A5A19" />
                                <Text style={styles.ratingText}>4.9</Text>
                            </View>
                        </View>
                        <Text style={styles.cardDesc}>
                            A tranquil sanctuary featuring traditional Japanese architecture, Koi ponds, and...
                        </Text>
                        
                        <View style={styles.cardFooter}>
                            <View style={styles.avatars}>
                                <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={styles.collabAvatar} />
                                <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={[styles.collabAvatar, { marginLeft: -10 }]} />
                                <View style={[styles.moreCollab, { marginLeft: -10 }]}>
                                    <Text style={styles.moreCollabText}>+12</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.addButton}>
                                <Text style={styles.addButtonText}>Add to Trip</Text>
                                <Ionicons name="add" size={18} color="#FFF" style={{marginLeft: 5}}/>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F5F5' },
  map: { ...StyleSheet.absoluteFillObject },
  markerContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  topContainer: { paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#114C5A' },
  avatarContainer: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  searchBox: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#111' },
  mapActions: { position: 'absolute', right: 20, bottom: Dimensions.get('window').height * 0.45 },
  mapBtn: { backgroundColor: '#FFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  cardContainer: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  cardInner: { backgroundColor: '#FFF', borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 8, overflow: 'hidden' },
  cardImage: { width: '100%', height: 180 },
  featuredBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#114C5A', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15 },
  featuredText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#114C5A' },
  ratingBadge: { flexDirection: 'row', backgroundColor: '#FDF1E3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignItems: 'center' },
  ratingText: { color: '#8A5A19', fontWeight: 'bold', marginLeft: 4, fontSize: 12 },
  cardDesc: { color: '#555', lineHeight: 20, marginBottom: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  collabAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#FFF' },
  moreCollab: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#114C5A', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  moreCollabText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  addButton: { backgroundColor: '#114C5A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});
