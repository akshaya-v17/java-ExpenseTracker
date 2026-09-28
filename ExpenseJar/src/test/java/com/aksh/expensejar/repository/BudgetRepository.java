package com.aksh.expensejar.repository;

import com.aksh.expensejar.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {

    Optional<Budget> findByUserIdAndCategoryIdAndBudgetMonth(
            Long userId,
            Long categoryId,
            LocalDate budgetMonth
    );

    java.util.List<Budget> findByUserId(Long userId);

    java.util.List<Budget> findByUserIdAndBudgetMonth(
            Long userId,
            LocalDate budgetMonth
    );
}