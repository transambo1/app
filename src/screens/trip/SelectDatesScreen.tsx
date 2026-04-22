import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    ScrollView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// --- HÀM HỖ TRỢ ĐỊNH DẠNG NGÀY THÁNG ---
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

export default function SelectDatesScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    // Dữ liệu từ Bước 1
    const { tripName, coverImage } = route.params || {};

    // --- STATE CHO LỊCH THẬT ---
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // --- LOGIC TẠO LỊCH ---
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) -> 6 (Sat)
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let calendarDays: { day: number, date: Date, isCurrentMonth: boolean }[][] = [];
    let currentWeek: { day: number, date: Date, isCurrentMonth: boolean }[] = [];

    // Điền những ngày cuối của tháng trước
    for (let i = 0; i < firstDayOfMonth; i++) {
        currentWeek.push({
            day: daysInPrevMonth - firstDayOfMonth + i + 1,
            date: new Date(year, month - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
            isCurrentMonth: false
        });
    }

    // Điền các ngày của tháng hiện tại
    for (let i = 1; i <= daysInCurrentMonth; i++) {
        currentWeek.push({
            day: i,
            date: new Date(year, month, i),
            isCurrentMonth: true
        });
        if (currentWeek.length === 7) {
            calendarDays.push(currentWeek);
            currentWeek = [];
        }
    }

    // Điền những ngày đầu của tháng sau cho đủ khung
    if (currentWeek.length > 0) {
        let nextMonthDay = 1;
        while (currentWeek.length < 7) {
            currentWeek.push({
                day: nextMonthDay++,
                date: new Date(year, month + 1, nextMonthDay - 1),
                isCurrentMonth: false
            });
        }
        calendarDays.push(currentWeek);
    }

    // --- XỬ LÝ SỰ KIỆN CHỌN NGÀY ---
    const handleDayPress = (selectedDate: Date) => {
        // Reset giờ phút giây để so sánh chính xác
        selectedDate.setHours(0, 0, 0, 0);

        if (!startDate || (startDate && endDate)) {
            // Chọn ngày bắt đầu mới
            setStartDate(selectedDate);
            setEndDate(null);
        } else if (startDate && !endDate) {
            // Đã có ngày bắt đầu -> Chọn ngày kết thúc
            if (selectedDate.getTime() < startDate.getTime()) {
                // Nếu chọn ngày trước ngày bắt đầu -> Đảo lại làm ngày bắt đầu mới
                setStartDate(selectedDate);
            } else {
                setEndDate(selectedDate);
            }
        }
    };

    const handlePrevMonth = () => {
        setCurrentMonthDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthDate(new Date(year, month + 1, 1));
    };

    // --- XỬ LÝ CHUYỂN TRANG ---
    const handleContinue = () => {
        if (!startDate || !endDate) {
            Alert.alert("Thiếu thông tin", "Vui lòng chọn đầy đủ Check-in và Check-out nhé!");
            return;
        }

        navigation.navigate('ReviewAdventure', {
            tripName,
            coverImage,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#114C5A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Digital Concierge</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.progressContainer}>
                    <Text style={styles.stepText}>STEP 2 OF 3</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressSegment, styles.progressActive]} />
                        <View style={[styles.progressSegment, styles.progressActive]} />
                        <View style={[styles.progressSegment, styles.progressInactive]} />
                    </View>
                </View>

                <Text style={styles.mainTitle}>Select Dates</Text>
                <Text style={styles.subtext}>When will your journey begin and end?</Text>

                {/* SHOW SELECTED DATES */}
                <View style={styles.dateBoxesContainer}>
                    <View style={[styles.dateBox, !endDate && startDate ? styles.dateBoxActive : {}]}>
                        <Text style={styles.dateLabel}>CHECK-IN</Text>
                        <Text style={startDate ? styles.dateValueActive : styles.dateValuePlaceholder}>
                            {formatDate(startDate)}
                        </Text>
                    </View>
                    <View style={[styles.dateBox, startDate && !endDate ? styles.dateBoxActive : {}]}>
                        <Text style={styles.dateLabel}>CHECK-OUT</Text>
                        <Text style={endDate ? styles.dateValueActive : styles.dateValuePlaceholder}>
                            {formatDate(endDate)}
                        </Text>
                    </View>
                </View>

                {/* REAL CALENDAR RENDER */}
                <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 5 }}>
                            <Ionicons name="chevron-back" size={20} color="#111" />
                        </TouchableOpacity>
                        <Text style={styles.monthText}>{MONTHS[month]} {year}</Text>
                        <TouchableOpacity onPress={handleNextMonth} style={{ padding: 5 }}>
                            <Ionicons name="chevron-forward" size={20} color="#111" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekDaysRow}>
                        {weekDays.map((day, idx) => (<Text key={idx} style={styles.weekDayText}>{day}</Text>))}
                    </View>

                    {calendarDays.map((week, weekIdx) => (
                        <View key={weekIdx} style={styles.daysRow}>
                            {week.map((cell, dayIdx) => {
                                const isStart = isSameDay(cell.date, startDate);
                                const isEnd = isSameDay(cell.date, endDate);
                                const isBetween = startDate && endDate && cell.date > startDate && cell.date < endDate;

                                return (
                                    <TouchableOpacity
                                        key={dayIdx}
                                        onPress={() => handleDayPress(cell.date)}
                                        activeOpacity={0.7}
                                        style={[
                                            styles.dayCell,
                                            isBetween && styles.dayBetween,
                                            isStart && styles.dayStart,
                                            isEnd && styles.dayEnd,
                                            (isStart && !endDate) && { borderRadius: 18 } // Nếu chỉ chọn start thì bo tròn cả 2 bên
                                        ]}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            !cell.isCurrentMonth && styles.dayTextDisabled,
                                            (isStart || isEnd || isBetween) && styles.dayTextActive
                                        ]}>
                                            {cell.day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>

                {/* Travel Insight */}
                <View style={styles.insightContainer}>
                    <View style={styles.insightHeader}>
                        <Ionicons name="information-circle" size={16} color="#114C5A" />
                        <Text style={styles.insightTitle}>TRAVEL INSIGHT</Text>
                    </View>
                    <Text style={styles.insightDesc}>
                        {MONTHS[month]} in your chosen destination is the <Text style={{ fontWeight: 'bold', color: '#111' }}>shoulder season</Text>. Expect mild weather and fewer crowds—perfect for serene exploration.
                    </Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
                    <Text style={styles.continueBtnText}>Continue to Review</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// Bê nguyên css cũ xuống đây
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: '#FFF' },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#114C5A' },
    scrollContent: { padding: 24, paddingBottom: 100 },
    progressContainer: { marginBottom: 20 },
    stepText: { fontSize: 12, fontWeight: 'bold', color: '#8A94A6', letterSpacing: 1.5, marginBottom: 10 },
    progressBar: { flexDirection: 'row', gap: 10 },
    progressSegment: { flex: 1, height: 4, borderRadius: 2 },
    progressActive: { backgroundColor: '#1E7585' },
    progressInactive: { backgroundColor: '#E0E7ED' },
    mainTitle: { fontSize: 34, fontWeight: '900', color: '#111827', marginBottom: 5 },
    subtext: { fontSize: 16, color: '#4B5563', marginBottom: 25 },
    dateBoxesContainer: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    dateBox: { flex: 1, backgroundColor: '#F0F4F8', padding: 20, borderRadius: 16 },
    dateBoxActive: { backgroundColor: '#F0F8F8', borderLeftWidth: 4, borderLeftColor: '#1E7585' },
    dateLabel: { fontSize: 10, fontWeight: 'bold', color: '#8A94A6', letterSpacing: 1, marginBottom: 8 },
    dateValuePlaceholder: { fontSize: 16, fontWeight: 'bold', color: '#99A3B0' },
    dateValueActive: { fontSize: 16, fontWeight: 'bold', color: '#1E7585' },
    calendarContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    monthText: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
    weekDayText: { fontSize: 12, fontWeight: 'bold', color: '#99A3B0' },
    daysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
    dayCell: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
    dayText: { fontSize: 14, color: '#111' },
    dayTextDisabled: { color: '#D1D5DB' },
    dayBetween: { backgroundColor: '#E8F5F5', borderRadius: 0 },
    dayStart: { backgroundColor: '#1E7585', borderTopRightRadius: 0, borderBottomRightRadius: 0 },
    dayEnd: { backgroundColor: '#1E7585', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
    dayTextActive: { color: '#FFF', fontWeight: 'bold' },
    insightContainer: { backgroundColor: '#EBF2F9', padding: 20, borderRadius: 16 },
    insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    insightTitle: { fontSize: 11, fontWeight: 'bold', color: '#114C5A', letterSpacing: 1, marginLeft: 6 },
    insightDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
    footer: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 20 : 24, paddingTop: 10, backgroundColor: '#F8F9FB' },
    continueBtn: { backgroundColor: '#1E7585', height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginRight: 10 }
});