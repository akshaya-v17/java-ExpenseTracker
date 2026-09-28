package com.aksh.expensejar.repository;

import com.aksh.expensejar.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUserId(Long userId);

    List<Expense> findByUserIdAndExpenseDateBetween(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );

    List<Expense> findByUserIdAndCategoryIdAndExpenseDateBetween(
            Long userId,
            Long categoryId,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.user.id = :userId
            AND e.category.id = :categoryId
            AND e.expenseDate BETWEEN :startDate AND :endDate
            """)
    BigDecimal getCategoryTotalForPeriod(
            Long userId,
            Long categoryId,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0)
            FROM Expense e
            WHERE e.user.id = :userId
            AND e.expenseDate BETWEEN :startDate AND :endDate
            """)
    BigDecimal getTotalForPeriod(
            Long userId,
            LocalDate startDate,
            LocalDate endDate
    );
}