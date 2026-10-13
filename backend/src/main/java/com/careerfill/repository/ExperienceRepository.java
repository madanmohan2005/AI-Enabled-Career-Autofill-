package com.careerfill.repository;

import com.careerfill.entity.Experience;
import com.careerfill.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    List<Experience> findByUser(User user);
    List<Experience> findByUserId(Long userId);
}
