import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function TripPlanScreen() {
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="menu" size={28} color="#114C5A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>The Digital Concierge</Text>
                <TouchableOpacity style={styles.shareIcon}>
                    <Ionicons name="share-social" size={24} color="#666" />
                </TouchableOpacity>
                <Image source={{ uri: avatar }} style={styles.headerAvatar} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtext}>CURATION NO. 02</Text>
                <Text style={styles.title}>Weekend in{'\n'}Tokyo</Text>
                <Text style={styles.desc}>A multi-sensory journey through Japan's neon-lit heart. From the historic dawn at the fish market to the digital frontiers of art.</Text>

                <View style={styles.optContainer}>
                    <TouchableOpacity style={styles.optBtn}>
                        <Ionicons name="git-network" size={14} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.optBtnText}>Optimize Route</Text>
                    </TouchableOpacity>
                    <Text style={styles.aiText}>AI ENABLED</Text>
                </View>

                {/* Day 01 */}
                <View style={styles.daySeparator}>
                    <Text style={styles.dayTitle}>Day 01</Text>
                    <View style={styles.dayLine} />
                </View>

                <View style={styles.timelineCont}>
                    {/* Event 1 */}
                    <View style={styles.eventRow}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineTrack} />

                        <View style={styles.eventCard}>
                            <View style={styles.eventHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.eventTime}>05:30 AM — BREAKFAST</Text>
                                    <Text style={styles.eventName}>Tsukiji Outer{'\n'}Market</Text>
                                </View>
                                <View style={styles.eventIconBox}>
                                    <Ionicons name="restaurant" size={16} color="#114C5A" />
                                </View>
                            </View>
                            <Text style={styles.eventDesc}>The morning begins with fresh uni and bluefin tuna at the world's most famous seafood market. Experience the bustle of morning traders.</Text>

                            <View style={styles.eventTags}>
                                <View style={styles.eventTag}><Text style={styles.eventTagText}>4.8 Rating</Text></View>
                                <View style={styles.eventTag}><Text style={styles.eventTagText}>Crowded</Text></View>
                            </View>

                            <Image source={{ uri: 'https://images.unsplash.com/photo-1554508498-8cd4e4702958?q=80&w=800&auto=format&fit=crop' }} style={styles.eventImg} />
                            <TouchableOpacity style={styles.viewMapBtn}>
                                <Ionicons name="map" size={12} color="#FFF" style={{ marginRight: 6 }} />
                                <Text style={styles.viewMapText}>View Map</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Transit 1 */}
                    <View style={styles.transitRow}>
                        <View style={styles.timelineTrackLineDash} />
                        <View style={styles.transitIcon}><Ionicons name="train" size={12} color="#114C5A" /></View>
                        <Text style={styles.transitText}>25 mins via Oedo Line</Text>
                        <View style={styles.transitLineRight} />
                    </View>

                    {/* Event 2 */}
                    <View style={[styles.eventRow, { marginTop: 15 }]}>
                        <View style={[styles.timelineDot, { backgroundColor: '#74C0E3' }]} />
                        <View style={styles.timelineTrack} />

                        <Image source={{ uri: 'https://images.unsplash.com/photo-1551043047-1d2adf00f3fd?q=80&w=800&auto=format&fit=crop' }} style={styles.eventImgLarge} />

                        <View style={styles.eventCardSecondary}>
                            <View style={styles.eventHeaderRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.eventTime}>11:00 AM — ART & TECH</Text>
                                    <Text style={styles.eventName}>TeamLab Planets</Text>
                                </View>
                                <View style={styles.eventIconBox}>
                                    <Ionicons name="color-palette" size={16} color="#114C5A" />
                                </View>
                            </View>
                            <Text style={styles.eventDesc}>Immerse yourself in a body-interactive digital art space. Walk through water and gardens of floating flowers.</Text>

                            <View style={styles.ticketRow}>
                                <Ionicons name="ticket" size={12} color="#114C5A" />
                                <Text style={styles.ticketText}>Tickets Booked for 11:15 AM</Text>
                            </View>
                        </View>
                    </View>

                    {/* Transit 2 */}
                    <View style={[styles.transitRow, { marginTop: 0 }]}>
                        <View style={styles.transitIconFill}><Ionicons name="walk" size={12} color="#114C5A" /></View>
                        <Text style={styles.transitText}>10 mins walking (Lalaport Toyosu)</Text>
                    </View>
                </View>

                {/* Day 02 */}
                <View style={styles.daySeparator}>
                    <Text style={styles.dayTitle}>Day 02</Text>
                    <View style={styles.dayLine} />
                </View>

                <TouchableOpacity style={styles.addDestBox}>
                    <View style={styles.addDestIcon}><Ionicons name="add" size={20} color="#114C5A" /></View>
                    <Text style={styles.addDestText}>Add a destination to start{'\n'}planning Sunday</Text>
                </TouchableOpacity>

                {/* Trip Friends bottom block */}
                <View style={styles.friendsBlock}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <View>
                            <Text style={styles.friendsBlockTitle}>Trip Friends</Text>
                            <Text style={styles.friendsBlockDesc}>4 collaborators managing this{'\n'}itinerary</Text>
                        </View>
                        <TouchableOpacity style={styles.manageBtn} onPress={() => navigation.navigate('Friends')}>
                            <Text style={styles.manageBtnText}>Manage</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.friendListItem}>
                        <View style={styles.flAvatarBox}>
                            <Image source={{ uri: 'https://i.pravatar.cc/100?img=9' }} style={styles.flAvatar} />
                            <View style={[styles.flStatus, { backgroundColor: '#4FD1C5' }]} />
                        </View>
                        <View>
                            <Text style={styles.flName}>Elena K.</Text>
                            <Text style={styles.flRole}>Editor</Text>
                        </View>
                    </View>

                    <View style={styles.friendListItem}>
                        <View style={styles.flAvatarBox}>
                            <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.flAvatar} />
                            <View style={[styles.flStatus, { backgroundColor: '#4FD1C5' }]} />
                        </View>
                        <View>
                            <Text style={styles.flName}>Marcus V.</Text>
                            <Text style={styles.flRole}>Viewer</Text>
                        </View>
                    </View>

                    <View style={styles.friendListItem}>
                        <View style={styles.flAvatarBox}>
                            <Image source={{ uri: 'https://i.pravatar.cc/100?img=5' }} style={styles.flAvatar} />
                            <View style={[styles.flStatus, { backgroundColor: '#999' }]} />
                        </View>
                        <View>
                            <Text style={styles.flName}>Sarah L.</Text>
                            <Text style={styles.flRole}>Editor</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.friendListItem, { borderStyle: 'dashed', borderWidth: 1, borderColor: '#D0D0D0', backgroundColor: 'transparent' }]}>
                        <View style={[styles.flAvatarBox, { backgroundColor: '#E6F0FF', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="person-add" size={14} color="#114C5A" />
                        </View>
                        <Text style={[styles.flName, { marginLeft: 0 }]}>Add Friend</Text>
                    </TouchableOpacity>

                </View>
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#114C5A', marginLeft: 10 },
    shareIcon: { marginRight: 15 },
    headerAvatar: { width: 32, height: 32, borderRadius: 16 },
    content: { padding: 20 },
    subtext: { fontSize: 10, fontWeight: 'bold', color: '#114C5A', marginBottom: 5, letterSpacing: 1 },
    title: { fontSize: 36, fontWeight: '900', color: '#111', lineHeight: 40, marginBottom: 15 },
    desc: { color: '#666', fontSize: 14, marginBottom: 25, lineHeight: 22 },
    optContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDF2FF', borderRadius: 25, alignSelf: 'flex-start', marginBottom: 40, paddingRight: 20 },
    optBtn: { backgroundColor: '#114C5A', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
    optBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    aiText: { fontSize: 10, fontWeight: 'bold', color: '#666', marginLeft: 15, letterSpacing: 1 },
    daySeparator: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dayTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginRight: 15 },
    dayLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
    timelineCont: { paddingLeft: 10, marginBottom: 40 },
    eventRow: { position: 'relative', marginBottom: 20 },
    timelineDot: { position: 'absolute', left: -5, top: 0, width: 10, height: 10, borderRadius: 5, backgroundColor: '#114C5A', zIndex: 10 },
    timelineTrack: { position: 'absolute', left: -1, top: 10, bottom: -40, width: 1, backgroundColor: '#DDF0FF' },
    eventCard: { marginLeft: 20, backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    eventHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    eventTime: { fontSize: 10, fontWeight: 'bold', color: '#666', letterSpacing: 0.5, marginBottom: 5 },
    eventName: { fontSize: 20, fontWeight: 'bold', color: '#111', lineHeight: 24 },
    eventIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center' },
    eventDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 15 },
    eventTags: { flexDirection: 'row', marginBottom: 15 },
    eventTag: { backgroundColor: '#F5F5F5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginRight: 10 },
    eventTagText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
    eventImg: { width: '100%', height: 140, borderRadius: 12 },
    viewMapBtn: { position: 'absolute', top: 215, left: '60%', backgroundColor: '#2C3E50', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, transform: [{ translateX: -40 }] },
    viewMapText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
    transitRow: { paddingLeft: 10, flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    timelineTrackLineDash: { position: 'absolute', left: 9, top: -20, bottom: 20, width: 1, borderStyle: 'dotted', borderWidth: 1, borderColor: '#DDF0FF' },
    transitIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginRight: 15 },
    transitText: { fontSize: 12, color: '#666' },
    transitLineRight: { flex: 1, height: 1, backgroundColor: '#EAEAEA', marginLeft: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#EAEAEA' },
    eventImgLarge: { width: '100%', height: 160, borderRadius: 20, marginLeft: 20, marginBottom: 10 },
    eventCardSecondary: { marginLeft: 20, backgroundColor: '#FFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    ticketRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    ticketText: { fontSize: 12, fontWeight: 'bold', color: '#114C5A', marginLeft: 6 },
    transitIconFill: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', marginLeft: 10, marginRight: 15 },
    addDestBox: { backgroundColor: '#F0F4FF', borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 40 },
    addDestIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    addDestText: { fontSize: 14, color: '#111', textAlign: 'center', lineHeight: 20 },
    friendsBlock: { marginTop: 10 },
    friendsBlockTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 5 },
    friendsBlockDesc: { fontSize: 12, color: '#666', lineHeight: 18 },
    manageBtn: { backgroundColor: '#DDE8FF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 16 },
    manageBtnText: { color: '#114C5A', fontWeight: 'bold', fontSize: 12 },
    friendListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10 },
    flAvatarBox: { position: 'relative', marginRight: 15 },
    flAvatar: { width: 40, height: 40, borderRadius: 20 },
    flStatus: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#FFF' },
    flName: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 2 },
    flRole: { fontSize: 10, color: '#666' }
});
