package com.careerfill.controller;

import com.careerfill.dto.ProfileDto;
import com.careerfill.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<ProfileDto> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        ProfileDto profile = profileService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<ProfileDto> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                                    @RequestBody ProfileDto profileDto) {
        ProfileDto updated = profileService.updateProfile(userDetails.getUsername(), profileDto);
        return ResponseEntity.ok(updated);
    }
}
