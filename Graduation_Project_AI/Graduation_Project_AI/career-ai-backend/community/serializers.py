from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, PostLike


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    author_initials = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'author', 'author_initials', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'author_initials', 'created_at']

    def get_author(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def get_author_initials(self, obj):
        name = f"{obj.author.first_name} {obj.author.last_name}".strip()
        if name:
            parts = name.split()
            return ''.join(p[0].upper() for p in parts[:2])
        return obj.author.username[:2].upper()


class PostSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    author_initials = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()
    is_mine = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'author', 'author_initials', 'category',
            'title', 'content', 'pinned',
            'created_at', 'updated_at',
            'likes_count', 'liked_by_me', 'is_mine',
            'comments', 'comments_count',
        ]
        read_only_fields = ['id', 'author', 'author_initials', 'pinned', 'created_at', 'updated_at']

    def get_author(self, obj):
        return f"{obj.author.first_name} {obj.author.last_name}".strip() or obj.author.username

    def get_author_initials(self, obj):
        name = f"{obj.author.first_name} {obj.author.last_name}".strip()
        if name:
            parts = name.split()
            return ''.join(p[0].upper() for p in parts[:2])
        return obj.author.username[:2].upper()

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_liked_by_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.author_id == request.user.id
        return False

    def get_comments_count(self, obj):
        return obj.comments.count()
