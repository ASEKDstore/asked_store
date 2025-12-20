import { useState, useMemo, useEffect } from 'react'
import {
  getReviews,
  addReview,
  toggleReaction,
  addReply,
  deleteReview,
  deleteReply,
  type Review,
} from '../services/reviewsStore'
import { StarRating } from '../components/StarRating'
import { AddReviewSheet } from '../components/AddReviewSheet'
import { ReplySheet } from '../components/ReplySheet'
import { FullscreenGallery } from '../components/FullscreenGallery'
import type { ReviewFormData, ReactionKey, ReviewReply, ReviewMedia } from '../types/review'
import { getUIProducts, type UIProduct } from '../api/productsApi'
import './reviews.css'

type SortOption = 'new' | 'helpful' | 'withMedia' | 'low'
type FilterRating = null | 1 | 2 | 3 | 4 | 5

const PRESET_EMOJIS: ReactionKey[] = ['🔥', '🖤', '👍', '💎', '😂', '😮‍💨']

// Mock текущего пользователя (в реальном приложении из контекста/API)
const CURRENT_USER = {
  tgId: 'current_user',
  name: 'Вы',
  username: 'you',
  avatarUrl: 'https://i.pravatar.cc/150?img=33',
}

const IS_ADMIN = false // В реальном приложении из контекста/API

export const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [products, setProducts] = useState<UIProduct[]>([])
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [filterRating, setFilterRating] = useState<FilterRating>(null)
  const [sort, setSort] = useState<SortOption>('new')
  const [fullscreenMedia, setFullscreenMedia] = useState<{ images: string[]; startIndex: number } | null>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [replySheet, setReplySheet] = useState<{ reviewId: string; authorName: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ reviewId: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null) // reviewId или null

  useEffect(() => {
    setReviews(getReviews())
  }, [])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const prods = await getUIProducts()
        setProducts(prods)
      } catch (error) {
        console.error('Failed to load products for reviews:', error)
      }
    }
    loadProducts()
  }, [])

  // Расчёт рейтинга
  const ratingStats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        avgRating: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      }
    }

    const sum = reviews.reduce((acc: number, r: Review) => acc + r.rating, 0)
    const avgRating = Math.round((sum / reviews.length) * 10) / 10

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1
    })

    return {
      avgRating,
      total: reviews.length,
      distribution,
    }
  }, [reviews])

  // Фильтрация и сортировка
  const filteredAndSorted = useMemo(() => {
    let filtered = reviews

    // Фильтр по рейтингу
    if (filterRating !== null) {
      filtered = filtered.filter((r) => r.rating === filterRating)
    }

    // Сортировка
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'new':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'helpful':
          const aReactions = (Object.values(a.reactions || {}) as number[]).reduce((sum: number, v: number) => sum + v, 0) || a.likes || 0
          const bReactions = (Object.values(b.reactions || {}) as number[]).reduce((sum: number, v: number) => sum + v, 0) || b.likes || 0
          return bReactions - aReactions
        case 'withMedia':
          const aHasMedia = (a.media?.length || 0) > 0
          const bHasMedia = (b.media?.length || 0) > 0
          if (aHasMedia && !bHasMedia) return -1
          if (!aHasMedia && bHasMedia) return 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'low':
          return a.rating - b.rating
        default:
          return 0
      }
    })

    return sorted
  }, [reviews, filterRating, sort])

  const handleAddReview = (formData: ReviewFormData) => {
    // Создаём медиа URLs из File объектов
    const media = formData.media.map((file: File, idx: number) => ({
      id: `m-${Date.now()}-${idx}`,
      type: file.type.startsWith('video/') ? ('video' as const) : ('image' as const),
      url: URL.createObjectURL(file),
    }))

    const newReview: Review = {
      id: `r-${Date.now()}`,
      user: {
        tgId: 'current_user',
        name: 'Вы',
        username: 'you',
        avatarUrl: 'https://i.pravatar.cc/150?img=33',
      },
      rating: formData.rating!,
      text: formData.text,
      emojis: formData.emojis,
      media: media.length > 0 ? media : undefined,
      productId: formData.productId,
      productTitle: formData.productId
        ? products.find((p) => p.id === formData.productId)?.title
        : undefined,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      reactions: {
        '🔥': 0,
        '🖤': 0,
        '👍': 0,
        '💎': 0,
        '😂': 0,
        '😮‍💨': 0,
        '😡': 0,
        '✅': 0,
      },
      myReactions: {},
      replies: [],
    }

    addReview(newReview)
    setReviews(getReviews())
  }

  const handleToggleReaction = (reviewId: string, emoji: ReactionKey) => {
    toggleReaction(reviewId, emoji, CURRENT_USER)
    setReviews(getReviews())
    // Pulse animation
    setPulseId(`${reviewId}:${emoji}`)
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => setPulseId(null), 220)
    // Timer will be cleared on unmount, no need to store ref for this short timeout
  }

  const handleAddReply = (text: string, isAdmin: boolean) => {
    if (!replySheet) return

    const newReply: ReviewReply = {
      id: `reply-${Date.now()}`,
      user: isAdmin
        ? {
            tgId: 'admin',
            name: 'ASKED',
            isAdmin: true,
          }
        : {
            tgId: CURRENT_USER.tgId,
            name: CURRENT_USER.name,
            username: CURRENT_USER.username,
            avatarUrl: CURRENT_USER.avatarUrl,
          },
      text,
      createdAt: new Date().toISOString(),
    }

    addReply(replySheet.reviewId, newReply)
    setReviews(getReviews())
    setReplySheet(null)
  }

  const handleDeleteReview = (reviewId: string) => {
    if (deleteReview(reviewId, CURRENT_USER.tgId, IS_ADMIN)) {
      setReviews(getReviews())
      setDeleteConfirm(null)
    }
  }

  const handleDeleteReply = (reviewId: string, replyId: string) => {
    if (deleteReply(reviewId, replyId, CURRENT_USER.tgId, IS_ADMIN)) {
      setReviews(getReviews())
    }
  }

  const handleMediaClick = (review: Review, index: number) => {
    if (!review.media || review.media.length === 0) return

    const images = review.media
      .filter((m: ReviewMedia) => m.type === 'image')
      .map((m: ReviewMedia) => m.url)
    
    if (images.length > 0) {
      const imageIndex = review.media
        .slice(0, index + 1)
        .filter((m: ReviewMedia) => m.type === 'image').length - 1
      
      setFullscreenMedia({
        images,
        startIndex: Math.max(0, imageIndex),
      })
    }
  }

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Сегодня'
    if (diffDays === 1) return 'Вчера'
    if (diffDays < 7) return `${diffDays} дня назад`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="reviews-page">
      {/* Header */}
      <div className="reviews-header">
        <h1 className="reviews-title">Отзывы</h1>
        <p className="reviews-subtitle">Рейтинг магазина</p>

        {/* Большой блок рейтинга */}
        <div className="reviews-rating-block">
          <div className="reviews-rating-value">{ratingStats.avgRating.toFixed(1)}</div>
          <StarRating rating={ratingStats.avgRating} readOnly size="large" />
          <div className="reviews-rating-count">
            на основе {ratingStats.total} {ratingStats.total === 1 ? 'отзыва' : ratingStats.total < 5 ? 'отзывов' : 'отзывов'}
          </div>
        </div>

        {/* Распределение по звёздам */}
        <div className="reviews-distribution">
          {[5, 4, 3, 2, 1].map((stars: number) => {
            const count = ratingStats.distribution[stars] || 0
            const percentage = ratingStats.total > 0 ? (count / ratingStats.total) * 100 : 0
            return (
              <div key={stars} className="reviews-distribution-row">
                <div className="reviews-distribution-label">
                  {stars}★
                </div>
                <div className="reviews-distribution-bar">
                  <div
                    className="reviews-distribution-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="reviews-distribution-count">
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="reviews-controls">
        {/* Фильтры по звёздам */}
        <div className="reviews-filter-chips">
          <button
            type="button"
            className={`reviews-filter-chip ${filterRating === null ? 'is-active' : ''}`}
            onClick={() => setFilterRating(null)}
          >
            Все
          </button>
          {[5, 4, 3, 2, 1].map((stars: number) => (
            <button
              key={stars}
              type="button"
              className={`reviews-filter-chip ${filterRating === stars ? 'is-active' : ''}`}
              onClick={() => setFilterRating(stars as FilterRating)}
            >
              {stars}★
            </button>
          ))}
        </div>

        {/* Сортировка */}
        <select
          className="reviews-sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
        >
          <option value="new">Новые</option>
          <option value="helpful">Полезные</option>
          <option value="withMedia">С фото</option>
          <option value="low">Низкая оценка</option>
        </select>
      </div>

      {/* Кнопка "Оставить отзыв" */}
      <div className="reviews-add-section">
        <button
          className="reviews-add-btn"
          onClick={() => setIsAddSheetOpen(true)}
          type="button"
        >
          Оставить отзыв
        </button>
      </div>

      {/* Лента отзывов */}
      <div className="reviews-list">
        {filteredAndSorted.length === 0 ? (
          <div className="reviews-empty">
            <div className="reviews-empty-icon">📝</div>
            <div className="reviews-empty-text">Пока нет отзывов</div>
          </div>
        ) : (
          filteredAndSorted.map((review: Review) => (
            <div key={review.id} className="reviews-card">
              {/* User info */}
              <div className="reviews-card-header">
                <div className="reviews-card-user">
                  <img
                    src={review.user.avatarUrl || 'https://i.pravatar.cc/150?img=33'}
                    alt={review.user.name}
                    className="reviews-card-avatar"
                  />
                  <div className="reviews-card-user-info">
                    <div className="reviews-card-name">{review.user.name}</div>
                    {review.user.username && (
                      <div className="reviews-card-username">@{review.user.username}</div>
                    )}
                  </div>
                </div>
                <div className="reviews-card-date">{formatDate(review.createdAt)}</div>
              </div>

              {/* Rating */}
              <div className="reviews-card-rating">
                <StarRating rating={review.rating} readOnly size="small" />
              </div>

              {/* Product (если есть) */}
              {review.productTitle && (
                <div className="reviews-card-product">
                  Товар: {review.productTitle}
                </div>
              )}

              {/* Text */}
              <div className="reviews-card-text">{review.text}</div>

              {/* Emojis */}
              {review.emojis && review.emojis.length > 0 && (
                <div className="reviews-card-emojis">
                  {review.emojis.map((emoji: string, idx: number) => (
                    <span key={idx} className="reviews-card-emoji">
                      {emoji}
                    </span>
                  ))}
                </div>
              )}

              {/* Media */}
              {review.media && review.media.length > 0 && (
                <div className="reviews-card-media">
                  {review.media.map((item: ReviewMedia, idx: number) => (
                    <div
                      key={item.id}
                      className="reviews-card-media-item"
                      onClick={() => item.type === 'image' && handleMediaClick(review, idx)}
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt={`Media ${idx + 1}`} />
                      ) : (
                        <div className="reviews-card-media-video">
                          <video src={item.url} muted />
                          <div className="reviews-card-media-play">▶</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Menu button */}
              {(IS_ADMIN || review.user.tgId === CURRENT_USER.tgId) && (
                <div className="reviews-card-menu">
                  <button
                    type="button"
                    className="reviews-card-menu-btn"
                    onClick={() => setMenuOpen(menuOpen === review.id ? null : review.id)}
                  >
                    ⋯
                  </button>
                  {menuOpen === review.id && (
                    <div className="reviews-card-menu-dropdown">
                      {(IS_ADMIN || review.user.tgId === CURRENT_USER.tgId) && (
                        <button
                          type="button"
                          className="reviews-card-menu-item reviews-card-menu-item-danger"
                          onClick={() => {
                            setMenuOpen(null)
                            setDeleteConfirm({ reviewId: review.id })
                          }}
                        >
                          Удалить отзыв
                        </button>
                      )}
                      {(IS_ADMIN || review.user.tgId === CURRENT_USER.tgId) && (
                        <button
                          type="button"
                          className="reviews-card-menu-item"
                          onClick={() => {
                            setMenuOpen(null)
                            setReplySheet({ reviewId: review.id, authorName: review.user.name })
                          }}
                        >
                          Ответить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Reactions */}
              <div className="rx-row">
                {PRESET_EMOJIS.map((emoji: ReactionKey) => {
                  const count = review.reactions?.[emoji] || 0
                  const isActive = review.myReactions?.[emoji] === true
                  const shouldShow = count > 0 || isActive

                  if (!shouldShow) return null

                  return (
                    <button
                      key={emoji}
                      type="button"
                      className={`rx-pill ${isActive ? 'is-on' : ''} ${
                        pulseId === `${review.id}:${emoji}` ? 'pulse' : ''
                      }`}
                      onClick={() => handleToggleReaction(review.id, emoji)}
                    >
                      <span className="rx-emoji">{emoji}</span>
                      {count > 0 && <span className="rx-count">{count}</span>}
                    </button>
                  )
                })}
              </div>

              {/* Replies */}
              {review.replies && review.replies.length > 0 && (
                <div className="reply-list">
                  {review.replies.map((reply: ReviewReply) => (
                    <div key={reply.id} className="reply-card">
                      <div className="reply-head">
                        <img
                          src={reply.user.avatarUrl || 'https://i.pravatar.cc/150?img=33'}
                          alt={reply.user.name}
                          className="reply-avatar"
                        />
                        <div className="reply-info">
                          <div className="reply-name">
                            {reply.user.isAdmin ? 'ASKED' : reply.user.name}
                          </div>
                          <div className="reply-date">{formatDate(reply.createdAt)}</div>
                        </div>
                        {(IS_ADMIN || reply.user.tgId === CURRENT_USER.tgId) && (
                          <button
                            type="button"
                            className="reply-del"
                            onClick={() => handleDeleteReply(review.id, reply.id)}
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                      <div className="reply-text">{reply.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply button */}
              <div className="reviews-card-actions">
                <button
                  type="button"
                  className="reviews-card-reply-btn"
                  onClick={() => setReplySheet({ reviewId: review.id, authorName: review.user.name })}
                >
                  Ответить
                </button>
              </div>

              {/* Legacy admin reply (для совместимости) */}
              {review.adminReply && (!review.replies || review.replies.length === 0) && (
                <div className="reviews-card-reply">
                  <div className="reviews-card-reply-header">
                    <div className="reviews-card-reply-label">Ответ ASKED</div>
                    <div className="reviews-card-reply-date">
                      {formatDate(review.adminReply.createdAt)}
                    </div>
                  </div>
                  <div className="reviews-card-reply-text">{review.adminReply.text}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Review Sheet */}
      <AddReviewSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSubmit={handleAddReview}
      />

      {/* Reply Sheet */}
      {replySheet && (
        <ReplySheet
          isOpen={true}
          onClose={() => setReplySheet(null)}
          onSubmit={handleAddReply}
          isAdmin={IS_ADMIN}
          reviewAuthorName={replySheet.authorName}
        />
      )}

      {/* Delete Confirm Sheet */}
      {deleteConfirm && (
        <div
          className="tg-sheet-overlay is-visible"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="tg-sheet delete-confirm-sheet is-visible"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Подтверждение удаления"
          >
            <div className="tg-handle" />
            <div className="tg-titlebar">
              <div className="tg-title">Удалить отзыв?</div>
            </div>
            <div className="tg-sheet-body">
              <div className="delete-confirm-text">
                Это действие нельзя отменить.
              </div>
              <div className="tg-actions">
                <button
                  className="tg-btn tg-btn-danger"
                  onClick={() => handleDeleteReview(deleteConfirm.reviewId)}
                >
                  Удалить
                </button>
                <button
                  className="tg-btn tg-btn-ghost"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Media Viewer */}
      {fullscreenMedia && (
        <FullscreenGallery
          images={fullscreenMedia.images}
          startIndex={fullscreenMedia.startIndex}
          isOpen={true}
          onClose={() => setFullscreenMedia(null)}
        />
      )}
    </div>
  )
}

