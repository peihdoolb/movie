# Proguard rules for Peih Movie
-keep class com.peihdoolb.movie.data.model.** { *; }
-keepclassmembers class * {
    @kotlinx.serialization.Serializable *;
}
