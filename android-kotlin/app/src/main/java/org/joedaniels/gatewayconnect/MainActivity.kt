package org.joedaniels.gatewayconnect

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.DocumentChange
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            GatewayConnectKotlinApp()
        }
    }
}

enum class GatewayTab(val label: String) {
    FEED("Feed"),
    CHAT("Chat"),
    SERMONS("Sermons"),
    GROUPS("Groups"),
    PRAYER("Prayer"),
    PROFILE("Profile")
}

data class SermonVideo(
    val id: String,
    val title: String,
    val speaker: String,
    val source: String, // "YouTube", "Facebook", "Uploaded"
    val videoUrl: String,
    val duration: String,
    val isDownloadedOffline: Boolean = false
)

data class ChatMsg(
    val id: String,
    val sender: String,
    val text: String,
    val timestamp: String,
    val isMe: Boolean,
    val status: String // "sent", "delivered", "read"
)

@Composable
fun GatewayConnectKotlinApp() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("gateway_prefs", Context.MODE_PRIVATE) }
    var isDarkTheme by remember { mutableStateOf(prefs.getBoolean("dark_theme", true)) }
    var activeTab by remember { mutableStateOf(GatewayTab.FEED) }
    var prayerAlertBanner by remember { mutableStateOf<String?>(null) }

    val primaryBlue = Color(0xFF0095F6)
    val bgCanvas = if (isDarkTheme) Color(0xFF0B0F19) else Color(0xFFF8FAFC)
    val cardSurface = if (isDarkTheme) Color(0xFF131D31) else Color(0xFFFFFFFF)
    val textPrimary = if (isDarkTheme) Color(0xFFF8FAFC) else Color(0xFF0F172A)

    // Real-time Firestore listener for prayerRequests collection
    LaunchedEffect(Unit) {
        try {
            val db = FirebaseFirestore.getInstance()
            db.collection("prayerRequests")
                .addSnapshotListener { snapshots, error ->
                    if (error != null || snapshots == null) return@addSnapshotListener
                    for (dc in snapshots.documentChanges) {
                        if (dc.type == DocumentChange.Type.MODIFIED) {
                            val title = dc.document.getString("title") ?: "Prayer Petition"
                            val count = dc.document.getLong("prayingCount") ?: 1L
                            prayerAlertBanner = "🙏 Someone just prayed with \"$title\" ($count praying now!)"
                        }
                    }
                }
        } catch (_: Exception) {
        }
    }

    Scaffold(
        containerColor = bgCanvas,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(cardSurface)
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Gateway Connect ✨",
                    color = textPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.ExtraBold
                )
                IconButton(
                    onClick = {
                        isDarkTheme = !isDarkTheme
                        prefs.edit().putBoolean("dark_theme", isDarkTheme).apply()
                    }
                ) {
                    Icon(
                        imageVector = if (isDarkTheme) Icons.Default.LightMode else Icons.Default.DarkMode,
                        contentDescription = "Toggle Theme",
                        tint = primaryBlue
                    )
                }
            }
        },
        bottomBar = {
            NavigationBar(containerColor = cardSurface) {
                GatewayTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = activeTab == tab,
                        onClick = { activeTab = tab },
                        icon = {
                            Icon(
                                imageVector = when (tab) {
                                    GatewayTab.FEED -> Icons.Default.Home
                                    GatewayTab.CHAT -> Icons.Default.ChatBubble
                                    GatewayTab.SERMONS -> Icons.Default.PlayCircle
                                    GatewayTab.GROUPS -> Icons.Default.Groups
                                    GatewayTab.PRAYER -> Icons.Default.VolunteerActivism
                                    GatewayTab.PROFILE -> Icons.Default.Person
                                },
                                contentDescription = tab.label
                            )
                        },
                        label = { Text(tab.label, fontSize = 10.sp) }
                    )
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            AnimatedVisibility(visible = prayerAlertBanner != null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(primaryBlue)
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = prayerAlertBanner ?: "",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f)
                    )
                    TextButton(onClick = { prayerAlertBanner = null }) {
                        Text("Dismiss", color = Color.White)
                    }
                }
            }
        }
    }
}
