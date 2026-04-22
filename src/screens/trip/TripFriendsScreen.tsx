import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
    ActivityIndicator, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../../services/firebase';
import { doc, onSnapshot, getDocs, query, collection, where, documentId } from 'firebase/firestore';

export default function TripFriendsScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const [loading, setLoading] = useState(true);
    const [ownerAvatar, setOwnerAvatar] = useState('https://i.pravatar.cc/100?img=11');
    const [ownerName, setOwnerName] = useState('You');

    const [friendsList, setFriendsList] = useState<any[]>([]);

    // Khởi tạo danh sách collab từ params (nếu đã chọn trước đó)
    const [collaborators, setCollaborators] = useState<any[]>(route.params?.currentCollaborators || []);

    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [roleModalVisible, setRoleModalVisible] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
    const [selectedCollab, setSelectedCollab] = useState<any>(null);

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), async (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setOwnerAvatar(data.avatar || 'https://i.pravatar.cc/100?img=11');
                setOwnerName(data.name || 'You');

                if (data.friends && data.friends.length > 0) {
                    try {
                        const q = query(collection(db, "users"), where(documentId(), "in", data.friends.slice(0, 10)));
                        const snaps = await getDocs(q);
                        const friendsData = snaps.docs.map(d => ({ id: d.id, ...d.data() }));
                        setFriendsList(friendsData);
                    } catch (e) {
                        console.log("Error fetching friends", e);
                    }
                }
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setSearchResults(friendsList);
            return;
        }
        const filteredLocal = friendsList.filter(f =>
            f.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filteredLocal);

        if (searchQuery.includes('@')) {
            searchGlobalUser(searchQuery.toLowerCase());
        }
    }, [searchQuery, friendsList]);

    const searchGlobalUser = async (email: string) => {
        setIsSearchingGlobal(true);
        try {
            const q = query(collection(db, "users"), where("email", "==", email));
            const snaps = await getDocs(q);
            if (!snaps.empty) {
                const globalUser = { id: snaps.docs[0].id, ...snaps.docs[0].data() };
                setSearchResults(prev => {
                    if (!prev.find(u => u.id === globalUser.id)) return [...prev, globalUser];
                    return prev;
                });
            }
        } catch (error) { }
        setIsSearchingGlobal(false);
    };

    const handleAddCollaborator = (user: any) => {
        const isAlreadyCollab = collaborators.find(c => c.id === user.id);
        if (isAlreadyCollab) {
            Alert.alert("Thông báo", "Người này đã ở trong chuyến đi!");
            return;
        }
        setCollaborators([{ ...user, role: 'VIEWER' }, ...collaborators]);
        setInviteModalVisible(false);
        setSearchQuery('');
    };

    const handleChangeRole = (newRole: string) => {
        if (!selectedCollab) return;

        if (newRole === 'REMOVE') {
            setCollaborators(collaborators.filter(c => c.id !== selectedCollab.id));
        } else {
            setCollaborators(collaborators.map(c =>
                c.id === selectedCollab.id ? { ...c, role: newRole } : c
            ));
        }
        setRoleModalVisible(false);
        setSelectedCollab(null);
    };

    const openRoleMenu = (collab: any) => {
        setSelectedCollab(collab);
        setRoleModalVisible(true);
    };

    // --- LOGIC LƯU (DONE) ---
    const handleSave = () => {
        // Truyền danh sách mới về lại trang CreateExplorePlaces
        navigation.navigate({
            name: 'CreateExplorePlaces',
            params: { collaborators },
            merge: true, // Chỉ cập nhật params, không sinh ra màn hình mới
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={28} color="#114C5A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Expedition</Text>

                {/* NÚT DONE THAY CHO AVATAR CŨ */}
                <TouchableOpacity onPress={handleSave} style={styles.doneBtn}>
                    <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtext}>CURRENT PROJECT</Text>
                <Text style={styles.title}>Team Roster</Text>
                <Text style={styles.desc}>Manage your elite team of explorers, coordinate roles, and finalize the trajectory of your next great adventure.</Text>

                <TouchableOpacity style={styles.inviteButton} onPress={() => setInviteModalVisible(true)}>
                    <Ionicons name="person-add" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.inviteText}>Invite via Link or Name</Text>
                </TouchableOpacity>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Active Collaborators</Text>
                    <View style={styles.memberBadge}>
                        <Text style={styles.memberBadgeText}>{collaborators.length + 1} MEMBERS</Text>
                    </View>
                </View>

                {/* OWNER CARD */}
                <View style={styles.collabCard}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: ownerAvatar }} style={styles.collabAvatar} />
                        <View style={styles.roleBadge}><Ionicons name="star" size={10} color="#FFF" /></View>
                    </View>
                    <View style={styles.collabInfo}>
                        <Text style={styles.collabName}>{ownerName} (You)</Text>
                        <Text style={styles.collabRole}>OWNER</Text>
                    </View>
                </View>

                {/* DYNAMIC COLLABORATORS */}
                {loading ? <ActivityIndicator color="#114C5A" style={{ marginVertical: 20 }} /> : (
                    collaborators.map((c) => (
                        <View style={styles.collabCard} key={c.id}>
                            <View style={styles.avatarWrapper}>
                                <Image source={{ uri: c.avatar || `https://i.pravatar.cc/100?u=${c.id}` }} style={styles.collabAvatar} />
                            </View>
                            <View style={styles.collabInfo}>
                                <Text style={styles.collabName}>{c.name || 'Explorer'}</Text>
                                <Text style={styles.collabRole}>{c.role}</Text>
                            </View>
                            <TouchableOpacity style={{ padding: 5 }} onPress={() => openRoleMenu(c)}>
                                <Ionicons name="ellipsis-vertical" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                {/* Team Permissions */}
                <View style={styles.permissionsBox}>
                    <Text style={styles.permTitle}>Team Permissions</Text>
                    <Text style={styles.permDesc}>Editors can modify itineraries and cast votes. Viewers can only see plans and chat.</Text>
                </View>
            </ScrollView>

            {/* MODALS */}
            {/* Modal Tìm & Mời */}
            <Modal visible={inviteModalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Invite Explorers</Text>
                            <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#999" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.searchBar}>
                            <Ionicons name="search" size={20} color="#99A3B0" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search friend's name or exact email..."
                                placeholderTextColor="#99A3B0"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {isSearchingGlobal && <ActivityIndicator size="small" color="#114C5A" />}
                        </View>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.searchResultItem} onPress={() => handleAddCollaborator(item)}>
                                    <Image source={{ uri: item.avatar || 'https://i.pravatar.cc/100' }} style={styles.searchAvatar} />
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={styles.searchName}>{item.name || 'Unknown'}</Text>
                                        <Text style={styles.searchEmail}>{item.email}</Text>
                                    </View>
                                    <Ionicons name="add-circle" size={24} color="#1E7585" />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Modal Phân Quyền */}
            <Modal visible={roleModalVisible} animationType="fade" transparent={true}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRoleModalVisible(false)}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.bsIndicator} />
                        <Text style={styles.bsTitle}>Manage {selectedCollab?.name}</Text>
                        <Text style={styles.bsSub}>Choose what they can do on this trip.</Text>

                        <TouchableOpacity style={styles.roleOption} onPress={() => handleChangeRole('EDITOR')}>
                            <View style={[styles.roleIconBox, { backgroundColor: '#E8F5F5' }]}>
                                <Ionicons name="pencil" size={20} color="#1E7585" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text style={styles.roleOptionTitle}>Editor</Text>
                                <Text style={styles.roleOptionDesc}>Can edit itinerary and manage votes</Text>
                            </View>
                            {selectedCollab?.role === 'EDITOR' && <Ionicons name="checkmark-circle" size={24} color="#1E7585" />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.roleOption} onPress={() => handleChangeRole('VIEWER')}>
                            <View style={[styles.roleIconBox, { backgroundColor: '#F0F4F8' }]}>
                                <Ionicons name="eye" size={20} color="#6B7280" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text style={styles.roleOptionTitle}>Viewer</Text>
                                <Text style={styles.roleOptionDesc}>Can only view plans and chat</Text>
                            </View>
                            {selectedCollab?.role === 'VIEWER' && <Ionicons name="checkmark-circle" size={24} color="#1E7585" />}
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.roleOption} onPress={() => handleChangeRole('REMOVE')}>
                            <View style={[styles.roleIconBox, { backgroundColor: '#FFEBEA' }]}>
                                <Ionicons name="trash" size={20} color="#D32F2F" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 15 }}>
                                <Text style={[styles.roleOptionTitle, { color: '#D32F2F' }]}>Remove from Expedition</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, backgroundColor: '#FFF' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#114C5A' },
    doneBtn: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#E8F5F5', borderRadius: 20 },
    doneBtnText: { color: '#1E7585', fontWeight: 'bold', fontSize: 14 },
    content: { padding: 20 },
    subtext: { fontSize: 10, fontWeight: 'bold', color: '#114C5A', marginBottom: 5, letterSpacing: 1 },
    title: { fontSize: 36, fontWeight: '900', color: '#111', lineHeight: 40, marginBottom: 15 },
    desc: { color: '#666', fontSize: 14, marginBottom: 25, lineHeight: 22 },
    inviteButton: { backgroundColor: '#114C5A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 25, marginBottom: 30 },
    inviteText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginRight: 10 },
    memberBadge: { backgroundColor: '#E0F4F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    memberBadgeText: { color: '#114C5A', fontSize: 10, fontWeight: 'bold' },
    collabCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    avatarWrapper: { position: 'relative' },
    collabAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#FFF' },
    roleBadge: { position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#114C5A', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    collabInfo: { flex: 1, marginLeft: 15 },
    collabName: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 2 },
    collabRole: { fontSize: 10, color: '#666', fontWeight: 'bold', letterSpacing: 1 },
    permissionsBox: { backgroundColor: '#F0F4FF', padding: 20, borderRadius: 16, marginTop: 10 },
    permTitle: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 5 },
    permDesc: { fontSize: 12, color: '#666', lineHeight: 18 },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', height: '80%', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', borderRadius: 16, paddingHorizontal: 15, height: 50, marginBottom: 20 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#111' },
    searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
    searchAvatar: { width: 40, height: 40, borderRadius: 20 },
    searchName: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 2 },
    searchEmail: { fontSize: 12, color: '#666' },

    bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
    bsIndicator: { width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
    bsTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 5 },
    bsSub: { fontSize: 14, color: '#666', marginBottom: 25 },
    roleOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
    roleIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    roleOptionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 2 },
    roleOptionDesc: { fontSize: 12, color: '#666' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 }
});